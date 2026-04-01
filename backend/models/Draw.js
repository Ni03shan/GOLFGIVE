const mongoose = require('mongoose');

const winnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  matchType: { type: String, enum: ['5-match', '4-match', '3-match'] },
  matchedNumbers: [Number],
  prizeAmount: { type: Number, default: 0 },
  verificationStatus: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  proofUrl: { type: String, default: '' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt: { type: Date }
});

const drawSchema = new mongoose.Schema({
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  drawnNumbers: [{ type: Number, min: 1, max: 45 }],
  drawType: { type: String, enum: ['random', 'algorithmic'], default: 'random' },
  status: {
    type: String,
    enum: ['scheduled', 'simulated', 'published', 'completed'],
    default: 'scheduled'
  },

  prizePools: {
    fiveMatch: { total: { type: Number, default: 0 }, rolledOver: { type: Boolean, default: false }, previousRollover: { type: Number, default: 0 } },
    fourMatch: { total: { type: Number, default: 0 } },
    threeMatch: { total: { type: Number, default: 0 } }
  },

  totalSubscribers: { type: Number, default: 0 },
  totalPrizePool: { type: Number, default: 0 },

  winners: [winnerSchema],
  simulationData: { type: mongoose.Schema.Types.Mixed, default: null },
  publishedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

drawSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Draw', drawSchema);
