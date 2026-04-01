const mongoose = require('mongoose');

const scoreEntrySchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 45
  },
  date: {
    type: Date,
    required: true
  },
  course: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

const scoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  scores: {
    type: [scoreEntrySchema],
    validate: {
      validator: function (v) {
        return v.length <= 5;
      },
      message: 'Maximum 5 scores allowed'
    }
  },
  updatedAt: { type: Date, default: Date.now }
});

scoreSchema.pre('save', function (next) {
  this.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
  // Keep only latest 5
  if (this.scores.length > 5) {
    this.scores = this.scores.slice(0, 5);
  }
  this.updatedAt = new Date();
  next();
});

scoreSchema.statics.addScore = async function (userId, scoreData) {
  let scoreDoc = await this.findOne({ user: userId });
  if (!scoreDoc) {
    scoreDoc = new this({ user: userId, scores: [] });
  }
  scoreDoc.scores.push(scoreData);
  await scoreDoc.save();
  return scoreDoc;
};

module.exports = mongoose.model('Score', scoreSchema);
