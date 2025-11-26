const express = require('express');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const { EVENT_TYPES, EVENT_STATUSES } = Event;

const sendSuccess = (res, status, data, message) =>
  res.status(status).json({ success: true, message, data });

const sendError = (res, status, message, errors) =>
  res.status(status).json({ success: false, message, errors });

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?:\s?(?:AM|PM|am|pm))?$/;

const parseObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const cleanOptionalString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const validateEventPayload = (payload, { partial = false } = {}) => {
  const errors = {};
  const data = {};
  const source = payload || {};

  if (!partial || source.name !== undefined) {
    if (typeof source.name !== 'string' || !source.name.trim()) {
      errors.name = 'Event name is required.';
    } else {
      data.name = source.name.trim();
    }
  }

  if (!partial || source.type !== undefined) {
    if (!EVENT_TYPES.includes(source.type)) {
      errors.type = `Event type must be one of: ${EVENT_TYPES.join(', ')}.`;
    } else {
      data.type = source.type;
    }
  }

  if (!partial || source.category !== undefined) {
    if (typeof source.category !== 'string' || !source.category.trim()) {
      errors.category = 'Category is required.';
    } else {
      data.category = source.category.trim();
    }
  }

  if (!partial || source.date !== undefined) {
    const parsedDate = parseDateValue(source.date);
    if (!parsedDate) {
      errors.date = 'A valid event date is required.';
    } else {
      data.date = parsedDate;
    }
  }

  if (!partial || source.time !== undefined) {
    if (typeof source.time !== 'string' || !source.time.trim()) {
      errors.time = 'Event time is required.';
    } else if (!TIME_PATTERN.test(source.time.trim())) {
      errors.time = 'Time must match HH:MM format (24h) with optional AM/PM suffix.';
    } else {
      data.time = source.time.trim();
    }
  }

  if (!partial || source.venue !== undefined) {
    if (typeof source.venue !== 'string' || !source.venue.trim()) {
      errors.venue = 'Venue is required.';
    } else {
      data.venue = source.venue.trim();
    }
  }

  if (!partial || source.ticketPrice !== undefined) {
    const price = Number.parseFloat(source.ticketPrice);
    if (!Number.isFinite(price) || price < 0) {
      errors.ticketPrice = 'Ticket price must be a non-negative number.';
    } else {
      data.ticketPrice = price;
    }
  }

  if (!partial || source.capacity !== undefined) {
    const capacity = Number.parseInt(source.capacity, 10);
    if (!Number.isFinite(capacity) || capacity < 1) {
      errors.capacity = 'Capacity must be a positive integer.';
    } else {
      data.capacity = capacity;
    }
  }

  if (source.description !== undefined) {
    if (source.description !== null && typeof source.description !== 'string') {
      errors.description = 'Description must be text.';
    } else {
      data.description = cleanOptionalString(source.description);
    }
  }

  if (source.image !== undefined) {
    if (source.image !== null && typeof source.image !== 'string') {
      errors.image = 'Image must be a string URL.';
    } else {
      data.image = cleanOptionalString(source.image);
    }
  }

  if (source.status !== undefined) {
    if (!EVENT_STATUSES.includes(source.status)) {
      errors.status = `Status must be one of: ${EVENT_STATUSES.join(', ')}.`;
    } else {
      data.status = source.status;
    }
  }

  return { data, errors };
};

const loadAvailability = async (rawEvents) => {
  const list = Array.isArray(rawEvents) ? rawEvents : [rawEvents].filter(Boolean);
  if (!list.length) return Array.isArray(rawEvents) ? [] : null;

  const documents = list.map((item) =>
    typeof item?.toObject === 'function' ? item.toObject({ virtuals: true }) : { ...item }
  );

  const ids = documents
    .map((doc) => parseObjectId(doc._id))
    .filter((id) => id instanceof mongoose.Types.ObjectId);

  let availabilityMap = new Map();
  if (ids.length) {
    const stats = await Booking.aggregate([
      { $match: { eventId: { $in: ids }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$eventId', quantity: { $sum: '$quantity' } } },
    ]);
    availabilityMap = new Map(stats.map((item) => [String(item._id), item.quantity]));
  }

  const enriched = documents.map((doc) => {
    const id = String(doc._id);
    const capacity = typeof doc.capacity === 'number' ? doc.capacity : 0;
    const sold = availabilityMap.get(id) || 0;
    return {
      ...doc,
      id,
      ticketsSold: sold,
      ticketsAvailable: Math.max(capacity - sold, 0),
    };
  });

  return Array.isArray(rawEvents) ? enriched : enriched[0] || null;
};

// GET /api/events - list events
router.get('/', async (req, res) => {
  try {
    const { type, category, status, search, from, to } = req.query;
    const filter = {};

    if (type && EVENT_TYPES.includes(type)) {
      filter.type = type;
    }

    if (category && typeof category === 'string') {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }

    if (status && EVENT_STATUSES.includes(status)) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'archived' };
    }

    if (search && typeof search === 'string') {
      const keyword = search.trim();
      if (keyword) {
        filter.$or = [
          { name: { $regex: keyword, $options: 'i' } },
          { venue: { $regex: keyword, $options: 'i' } },
          { category: { $regex: keyword, $options: 'i' } },
        ];
      }
    }

    if (from || to) {
      const dateFilter = {};
      const fromDate = parseDateValue(from);
      const toDate = parseDateValue(to);
      if (fromDate) {
        dateFilter.$gte = fromDate;
      }
      if (toDate) {
        dateFilter.$lte = toDate;
      }
      if (Object.keys(dateFilter).length) {
        filter.date = dateFilter;
      }
    }

    const events = await Event.find(filter).sort({ date: 1, time: 1 });
    const data = await loadAvailability(events);

    return sendSuccess(res, 200, data, undefined);
  } catch (error) {
    console.error('Failed to list events:', error);
    return sendError(res, 500, 'Unable to fetch events.');
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const eventId = parseObjectId(req.params.id);
    if (!eventId) {
      return sendError(res, 400, 'Invalid event identifier.');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }

    const data = await loadAvailability(event);
    return sendSuccess(res, 200, data, undefined);
  } catch (error) {
    console.error('Failed to fetch event detail:', error);
    return sendError(res, 500, 'Unable to fetch event details.');
  }
});

// POST /api/events - create event (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { data, errors } = validateEventPayload(req.body);
    if (Object.keys(errors).length) {
      return sendError(res, 422, 'Validation failed.', errors);
    }

    const createdBy = parseObjectId(req.user?.userId);
    if (createdBy) {
      data.createdBy = createdBy;
    }

    const event = new Event(data);
    await event.save();

    const response = await loadAvailability(event);
    return sendSuccess(res, 201, response, 'Event created successfully.');
  } catch (error) {
    console.error('Failed to create event:', error);
    return sendError(res, 500, 'Unable to create event.');
  }
});

// PUT /api/events/:id - update event (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const eventId = parseObjectId(req.params.id);
    if (!eventId) {
      return sendError(res, 400, 'Invalid event identifier.');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }

    const { data, errors } = validateEventPayload(req.body, { partial: true });
    if (Object.keys(errors).length) {
      return sendError(res, 422, 'Validation failed.', errors);
    }

    if (data.capacity !== undefined) {
      const capacityCheck = await Booking.aggregate([
        { $match: { eventId, status: { $ne: 'cancelled' } } },
        { $group: { _id: null, quantity: { $sum: '$quantity' } } },
      ]);
      const booked = capacityCheck[0]?.quantity || 0;
      if (data.capacity < booked) {
        return sendError(res, 409, 'Capacity cannot be less than booked tickets.', {
          capacity: `Already ${booked} tickets booked.`,
        });
      }
    }

    const updatedBy = parseObjectId(req.user?.userId);
    if (updatedBy) {
      data.updatedBy = updatedBy;
    }

    Object.assign(event, data);
    await event.save();

    const response = await loadAvailability(event);
    return sendSuccess(res, 200, response, 'Event updated successfully.');
  } catch (error) {
    console.error('Failed to update event:', error);
    return sendError(res, 500, 'Unable to update event.');
  }
});

// DELETE /api/events/:id - remove event (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const eventId = parseObjectId(req.params.id);
    if (!eventId) {
      return sendError(res, 400, 'Invalid event identifier.');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return sendError(res, 404, 'Event not found.');
    }

    const hasBookings = await Booking.exists({ eventId, status: { $ne: 'cancelled' } });
    if (hasBookings) {
      return sendError(res, 409, 'Cannot delete event with active bookings.');
    }

    await event.deleteOne();

    return sendSuccess(res, 200, { id: String(eventId) }, 'Event deleted successfully.');
  } catch (error) {
    console.error('Failed to delete event:', error);
    return sendError(res, 500, 'Unable to delete event.');
  }
});

module.exports = router;
