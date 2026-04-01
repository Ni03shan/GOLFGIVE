const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Draw = require('../models/Draw');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('charity.selected', 'name logo description');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'avatar'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
      .populate('charity.selected', 'name logo');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/charity', protect, async (req, res) => {
  try {
    const { charityId, contributionPercentage } = req.body;
    const user = await User.findById(req.user._id);

    if (charityId) user.charity.selected = charityId;
    if (contributionPercentage) {
      user.charity.contributionPercentage = Math.max(10, Math.min(100, contributionPercentage));
    }
    await user.save({ validateBeforeSave: false });

    const populated = await User.findById(user._id).populate('charity.selected', 'name logo description');
    res.json({ success: true, charity: populated.charity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/winnings', protect, async (req, res) => {
  try {
    const draws = await Draw.find({
      'winners.user': req.user._id,
      status: { $in: ['published', 'completed'] }
    }).select('month year drawnNumbers winners publishedAt');

    const winnings = draws.map(draw => {
      const winner = draw.winners.find(w => w.user.toString() === req.user._id.toString());
      return {
        drawId: draw._id,
        month: draw.month,
        year: draw.year,
        drawnNumbers: draw.drawnNumbers,
        matchType: winner?.matchType,
        matchedNumbers: winner?.matchedNumbers,
        prizeAmount: winner?.prizeAmount,
        verificationStatus: winner?.verificationStatus,
        paymentStatus: winner?.paymentStatus,
        publishedAt: draw.publishedAt
      };
    });

    res.json({ success: true, winnings, totals: req.user.winnings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/winnings/:drawId/proof', protect, async (req, res) => {
  try {
    const { proofUrl } = req.body;
    const draw = await Draw.findById(req.params.drawId);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found.' });

    const winner = draw.winners.find(w => w.user.toString() === req.user._id.toString());
    if (!winner) return res.status(404).json({ success: false, message: 'You are not a winner of this draw.' });

    winner.proofUrl = proofUrl;
    winner.verificationStatus = 'submitted';
    await draw.save();

    res.json({ success: true, message: 'Proof submitted for review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
