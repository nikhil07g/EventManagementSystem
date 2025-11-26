const mongoose = require('mongoose');

const PAYMENT_METHODS = ['card', 'upi', 'wallet', 'cash', 'other'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const BOOKING_STATUSES = ['confirmed', 'cancelled'];

const BookingSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seats: {
      type: [String],
      default: [],
      set: (value) =>
        Array.from(new Set((value || []).map((seat) => seat.trim()).filter((seat) => seat.length > 0))),
    },
    quantity: { type: Number, required: true, min: 1 },
    pricePerSeat: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'card' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'paid' },
    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed' },
    bookedAt: { type: Date, default: Date.now },
    userName: { type: String, trim: true },
    userEmail: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

BookingSchema.index({ eventId: 1, userId: 1, createdAt: -1 });
BookingSchema.index({ eventId: 1, status: 1 });
BookingSchema.index({ eventId: 1, seats: 1 });

const Booking = mongoose.model('Booking', BookingSchema);

Booking.PAYMENT_METHODS = PAYMENT_METHODS;
Booking.PAYMENT_STATUSES = PAYMENT_STATUSES;
Booking.BOOKING_STATUSES = BOOKING_STATUSES;

module.exports = Booking;
