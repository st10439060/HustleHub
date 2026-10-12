const { Schema, model } = require('mongoose');

const gigSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 1, max: 100000 },
    deliveryDays: { type: Number, required: true, min: 1, max: 365 },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

gigSchema.index({ category: 1, isActive: 1 });
gigSchema.index({ freelancer: 1 });

module.exports = model('Gig', gigSchema);
