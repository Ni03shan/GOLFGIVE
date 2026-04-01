const mongoose = require('mongoose');

const charitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, trim: true },
  logo: { type: String, default: '' },
  images: [{ type: String }],
  website: { type: String, default: '' },
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'sports', 'community', 'other'],
    default: 'other'
  },
  events: [{
    title: String,
    description: String,
    date: Date,
    location: String
  }],
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  totalReceived: { type: Number, default: 0 },
  subscriberCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

charitySchema.index({ name: 'text', description: 'text', category: 1 });

module.exports = mongoose.model('Charity', charitySchema);
