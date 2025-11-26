const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const { PAYMENT_METHODS } = Booking;

const sendSuccess = (res, status, data, message) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, errors });

const parseObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

const normalizeSeats = (seats) => {
  if (!Array.isArray(seats)) return [];
  return Array.from(
    new Set(
      seats
        .map((seat) => (typeof seat === 'string' ? seat.trim() : ''))
        .filter((seat) => seat.length > 0)
    )
  );
};

const validateBookingPayload = (payload = {}) => {
  const errors = {};
  const sanitized = {};

  const eventId = parseObjectId(payload.eventId);
  if (!eventId) {
    errors.eventId = 'A valid eventId is required.';
  } else {
    sanitized.eventId = eventId;
  }

  const seats = normalizeSeats(payload.seats);
  sanitized.seats = seats;

  const hasSeatSelection = seats.length > 0;
  let quantity = payload.quantity !== undefined ? Number.parseInt(payload.quantity, 10) : undefined;

  if (quantity !== undefined && (!Number.isFinite(quantity) || quantity < 1)) {
    errors.quantity = 'Quantity must be a positive integer.';
  }

  if (quantity === undefined) {
    quantity = seats.length;
  }

  if (!quantity || quantity < 1) {
    errors.quantity = 'Provide seat selections or specify a quantity to book.';
  }

  if (!errors.quantity && hasSeatSelection && quantity !== seats.length) {
    errors.quantity = 'Quantity must match the number of selected seats.';
  }

  if (!errors.quantity) {
    sanitized.quantity = quantity;
  }

  const rawPaymentMethod = payload.paymentMethod ? String(payload.paymentMethod).toLowerCase() : 'card';
  if (!PAYMENT_METHODS.includes(rawPaymentMethod)) {
    errors.paymentMethod = `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.`;
  } else {
    sanitized.paymentMethod = rawPaymentMethod;
  }

  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : undefined;
  if (notes) {
    sanitized.notes = notes;
  }

  return { data: sanitized, errors };
};

const getActiveBookingStats = async (eventId) => {
  const normalizedId = parseObjectId(eventId);
  if (!normalizedId) {
    return { bookedQuantity: 0, takenSeats: new Set() };
  }

  const activeBookings = await Booking.find({ eventId: normalizedId, status: { $ne: 'cancelled' } }).select(
    'seats quantity'
  );

  let bookedQuantity = 0;
  const takenSeats = new Set();

  activeBookings.forEach((booking) => {
    bookedQuantity += booking.quantity;
    (booking.seats || []).forEach((seat) => takenSeats.add(seat));
  });

  return { bookedQuantity, takenSeats };
};

const formatBookingResponse = (bookingDoc, extra = {}) => {
  const doc =
    typeof bookingDoc?.toObject === 'function'
      ? bookingDoc.toObject({ virtuals: true })
      : { ...bookingDoc };

  const event = doc.eventId && typeof doc.eventId === 'object' ? doc.eventId : null;

  return {
    id: String(doc._id),
    eventId: event?.id || event?._id?.toString?.() || String(doc.eventId),
    userId: doc.userId ? String(doc.userId) : undefined,
    seats: doc.seats || [],
    quantity: doc.quantity,
    pricePerSeat: doc.pricePerSeat,
    totalPrice: doc.totalPrice,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    bookedAt: doc.bookedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    userName: doc.userName,
    userEmail: doc.userEmail,
    notes: doc.notes || null,
    event: event
      ? {
          id: String(event._id || event.id),
          name: event.name,
          type: event.type,
          category: event.category,
          date: event.date,
          time: event.time,
          venue: event.venue,
          ticketPrice: event.ticketPrice,
          capacity: event.capacity,
          status: event.status,
        }
      : null,
    ...extra,
  };
};

// GET /api/bookings - list bookings (auth required)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filter = {};
    if (req.user?.role !== 'admin') {
      filter.userId = parseObjectId(req.user?.userId);
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'eventId',
        select: 'name type category date time venue ticketPrice capacity status',
      })
      .sort({ createdAt: -1 });

    const data = bookings.map((booking) => formatBookingResponse(booking));
    return sendSuccess(res, 200, data, undefined);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return sendError(res, 500, 'Unable to fetch bookings.');
  }
});

// POST /api/bookings - create a booking (auth required)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { data, errors } = validateBookingPayload(req.body);
    if (Object.keys(errors).length) {
      return sendError(res, 422, 'Validation failed.', errors);
    }

    const userId = parseObjectId(req.user?.userId);
    if (!userId) {
      return sendError(res, 401, 'Authentication required.');
    }

    const [user, event] = await Promise.all([
      User.findById(userId),
      Event.findById(data.eventId),
    ]);

    if (!user) {
      return sendError(res, 401, 'User account not found.');
    }

    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }

    if (event.status === 'cancelled' || event.status === 'archived') {
      return sendError(res, 409, 'Bookings are not allowed for this event.');
    }

    const { bookedQuantity, takenSeats } = await getActiveBookingStats(event._id);

    if (data.seats.length) {
      const conflictingSeats = data.seats.filter((seat) => takenSeats.has(seat));
      if (conflictingSeats.length) {
        return sendError(res, 409, 'Selected seats are no longer available.', {
          seats: conflictingSeats,
        });
      }
    }

    if (bookedQuantity + data.quantity > event.capacity) {
      const remaining = Math.max(event.capacity - bookedQuantity, 0);
      return sendError(res, 409, 'Not enough tickets available.', {
        quantity: `Only ${remaining} ticket(s) remaining.`,
      });
    }

    const pricePerSeat = Number(event.ticketPrice) || 0;
    const totalPrice = pricePerSeat * data.quantity;

    const booking = await Booking.create({
      eventId: event._id,
      userId,
      seats: data.seats,
      quantity: data.quantity,
      pricePerSeat,
      totalPrice,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed',
      userName: user.name,
      userEmail: user.email,
      notes: data.notes,
    });

    const populatedBooking = await booking.populate({
      path: 'eventId',
      select: 'name type category date time venue ticketPrice capacity status',
    });

    const ticketsRemaining = Math.max(event.capacity - (bookedQuantity + data.quantity), 0);
    const response = formatBookingResponse(populatedBooking, { ticketsRemaining });

    return sendSuccess(res, 201, response, 'Booking confirmed.');
  } catch (error) {
    console.error('Failed to create booking:', error);
    return sendError(res, 500, 'Unable to create booking.');
  }
});

// GET /api/bookings/:id - booking detail (auth required)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = parseObjectId(req.params.id);
    if (!bookingId) {
      return sendError(res, 400, 'Invalid booking identifier.');
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'eventId',
      select: 'name type category date time venue ticketPrice capacity status',
    });

    if (!booking) {
      return sendError(res, 404, 'Booking not found.');
    }

    const isOwner = String(booking.userId) === req.user?.userId;
    if (!isOwner && req.user?.role !== 'admin') {
      return sendError(res, 403, 'Access denied.');
    }

    const eventIdentifier = parseObjectId(booking.eventId?._id || booking.eventId);
    const stats = await getActiveBookingStats(eventIdentifier);
    const eventCapacity = booking.eventId?.capacity || 0;
    const ticketsRemaining = Math.max(eventCapacity - stats.bookedQuantity, 0);

    const response = formatBookingResponse(booking, { ticketsRemaining });
    return sendSuccess(res, 200, response, undefined);
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    return sendError(res, 500, 'Unable to fetch booking.');
  }
});

module.exports = router;
