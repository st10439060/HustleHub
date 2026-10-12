const { Schema, model } = require('mongoose');

const transactionSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    platformFee: { type: Number, required: true, min: 0 },
    freelancerAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  },
  { timestamps: true }
);

transactionSchema.index({ freelancer: 1, createdAt: -1 });

module.exports = model('Transaction', transactionSchema);
