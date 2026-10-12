const { Schema, model } = require('mongoose');

const bookingSchema = new Schema(
  {
    gig: { type: Schema.Types.ObjectId, ref: 'Gig', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requirements: { type: String, trim: true, maxlength: 2000 },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

bookingSchema.index({ client: 1, createdAt: -1 });
bookingSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = model('Booking', bookingSchema);
