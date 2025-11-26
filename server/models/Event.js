const mongoose = require('mongoose');

const EVENT_TYPES = ['Movie', 'Sports', 'Concert', 'Family'];
const EVENT_STATUSES = ['draft', 'active', 'cancelled', 'archived'];

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: EVENT_TYPES },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    ticketPrice: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    status: { type: String, enum: EVENT_STATUSES, default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

EventSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

EventSchema.index({ date: 1, time: 1 });
EventSchema.index({ type: 1, category: 1 });
EventSchema.index({ name: 1 });

const Event = mongoose.model('Event', EventSchema);

Event.EVENT_TYPES = EVENT_TYPES;
Event.EVENT_STATUSES = EVENT_STATUSES;

module.exports = Event;
