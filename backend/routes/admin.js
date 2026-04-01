const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Draw = require('../models/Draw');
const Charity = require('../models/Charity');
const Score = require('../models/Score');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeSubscribers, totalCharities, latestDraw] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ 'subscription.status': 'active' }),
      Charity.countDocuments({ isActive: true }),
      Draw.findOne({ status: { $in: ['published', 'completed'] } }).sort({ year: -1, month: -1 })
    ]);

    const totalPrizePool = latestDraw ? latestDraw.totalPrizePool : 0;
    const pendingWinners = await Draw.aggregate([
      { $unwind: '$winners' },
      { $match: { 'winners.verificationStatus': 'submitted' } },
      { $count: 'count' }
    ]);

    const charityTotals = await User.aggregate([
      { $match: { 'subscription.status': 'active' } },
      { $group: { _id: null, avgContribution: { $avg: '$charity.contributionPercentage' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeSubscribers,
        totalCharities,
        totalPrizePool,
        pendingVerifications: pendingWinners[0]?.count || 0,
        avgCharityContribution: charityTotals[0]?.avgContribution?.toFixed(1) || 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = { role: 'user' };
    if (status) query['subscription.status'] = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('charity.selected', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('charity.selected', 'name logo');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const scores = await Score.findOne({ user: req.params.id });
    res.json({ success: true, user, scores: scores?.scores || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id/scores', async (req, res) => {
  try {
    const { scores } = req.body;
    let scoreDoc = await Score.findOne({ user: req.params.id });
    if (!scoreDoc) scoreDoc = new Score({ user: req.params.id, scores: [] });
    scoreDoc.scores = scores;
    await scoreDoc.save();
    res.json({ success: true, scores: scoreDoc.scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/winners', async (req, res) => {
  try {
    const { status = 'submitted' } = req.query;
    const draws = await Draw.find({ 'winners.verificationStatus': status })
      .populate('winners.user', 'firstName lastName email')
      .sort({ publishedAt: -1 });

    const winners = [];
    draws.forEach(draw => {
      draw.winners
        .filter(w => w.verificationStatus === status)
        .forEach(w => {
          winners.push({
            drawId: draw._id,
            month: draw.month,
            year: draw.year,
            winner: w
          });
        });
    });

    res.json({ success: true, winners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/winners/:drawId/:winnerId/verify', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const draw = await Draw.findById(req.params.drawId);
    if (!draw) return res.status(404).json({ success: false, message: 'Draw not found.' });

    const winner = draw.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found.' });

    winner.verificationStatus = action === 'approve' ? 'approved' : 'rejected';
    await draw.save();

    res.json({ success: true, message: `Winner ${action}d successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/winners/:drawId/:winnerId/pay', async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.drawId);
    const winner = draw.winners.id(req.params.winnerId);
    if (!winner) return res.status(404).json({ success: false, message: 'Winner not found.' });

    winner.paymentStatus = 'paid';
    winner.paidAt = new Date();
    await draw.save();

    await User.findByIdAndUpdate(winner.user, {
      $inc: { 'winnings.pendingPayout': -winner.prizeAmount }
    });

    res.json({ success: true, message: 'Payout marked as completed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
