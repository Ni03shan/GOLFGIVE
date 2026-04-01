const express = require('express');
const router = express.Router();
const Draw = require('../models/Draw');
const User = require('../models/User');
const Score = require('../models/Score');
const { protect, adminOnly } = require('../middleware/auth');

const generateRandomNumbers = () => {
  const nums = new Set();
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
  return Array.from(nums).sort((a, b) => a - b);
};

const generateAlgorithmicNumbers = async () => {
  // Weight draw by most/least frequent scores across all users
  const allScores = await Score.find({});
  const freq = {};
  for (let doc of allScores) {
    for (let s of doc.scores) {
      freq[s.value] = (freq[s.value] || 0) + 1;
    }
  }
  const pool = [];
  for (let i = 1; i <= 45; i++) {
    const weight = Math.max(1, 10 - (freq[i] || 0));
    for (let w = 0; w < weight; w++) pool.push(i);
  }
  // Pick 5 unique
  const nums = new Set();
  let attempts = 0;
  while (nums.size < 5 && attempts < 1000) {
    nums.add(pool[Math.floor(Math.random() * pool.length)]);
    attempts++;
  }
  return Array.from(nums).sort((a, b) => a - b);
};

const checkMatches = (userScores, drawnNumbers) => {
  const userVals = userScores.map(s => s.value);
  return drawnNumbers.filter(n => userVals.includes(n));
};

const calculatePrizePools = (subscriberCount, plan = 'monthly') => {
  const monthlyRate = 9.99;
  const yearlyRate = 89.99;
  const pricePerUser = plan === 'yearly' ? yearlyRate / 12 : monthlyRate;
  const totalPool = subscriberCount * pricePerUser * 0.6; // 60% to prizes
  return {
    fiveMatch: totalPool * 0.40,
    fourMatch: totalPool * 0.35,
    threeMatch: totalPool * 0.25,
    total: totalPool
  };
};

router.get('/current', async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: { $in: ['published', 'completed'] } })
      .sort({ year: -1, month: -1 })
      .populate('winners.user', 'firstName lastName avatar');
    res.json({ success: true, draw });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const draws = await Draw.find({ status: { $in: ['published', 'completed'] } })
      .sort({ year: -1, month: -1 })
      .select('-simulationData')
      .limit(12);
    res.json({ success: true, draws });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my-results', protect, async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user._id });
    const draws = await Draw.find({ status: { $in: ['published', 'completed'] } })
      .sort({ year: -1, month: -1 }).limit(6);

    const results = draws.map(draw => {
      const matched = scoreDoc ? checkMatches(scoreDoc.scores, draw.drawnNumbers) : [];
      return {
        drawId: draw._id,
        month: draw.month,
        year: draw.year,
        drawnNumbers: draw.drawnNumbers,
        matched,
        matchCount: matched.length
      };
    });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/simulate', protect, adminOnly, async (req, res) => {
  try {
    const { month, year, drawType = 'random' } = req.body;
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    const drawnNumbers = drawType === 'algorithmic'
      ? await generateAlgorithmicNumbers()
      : generateRandomNumbers();

    const subscribers = await User.find({ 'subscription.status': 'active' });
    const pools = calculatePrizePools(subscribers.length);

    const matchSummary = { fiveMatch: 0, fourMatch: 0, threeMatch: 0 };
    for (const user of subscribers) {
      const scoreDoc = await Score.findOne({ user: user._id });
      if (!scoreDoc) continue;
      const matched = checkMatches(scoreDoc.scores, drawnNumbers);
      if (matched.length === 5) matchSummary.fiveMatch++;
      else if (matched.length === 4) matchSummary.fourMatch++;
      else if (matched.length === 3) matchSummary.threeMatch++;
    }

    let draw = await Draw.findOne({ month: m, year: y });
    if (!draw) draw = new Draw({ month: m, year: y });

    draw.drawnNumbers = drawnNumbers;
    draw.drawType = drawType;
    draw.status = 'simulated';
    draw.totalSubscribers = subscribers.length;
    draw.totalPrizePool = pools.total;
    draw.prizePools = {
      fiveMatch: { total: pools.fiveMatch },
      fourMatch: { total: pools.fourMatch },
      threeMatch: { total: pools.threeMatch }
    };
    draw.simulationData = { matchSummary, generatedAt: new Date() };

    await draw.save();
    res.json({ success: true, draw, matchSummary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/publish', protect, adminOnly, async (req, res) => {
  try {
    const { month, year } = req.body;
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();

    let draw = await Draw.findOne({ month: m, year: y });
    if (!draw || !draw.drawnNumbers.length) {
      return res.status(400).json({ success: false, message: 'Run simulation first.' });
    }

    const subscribers = await User.find({ 'subscription.status': 'active' });
    const winners = [];

    for (const user of subscribers) {
      const scoreDoc = await Score.findOne({ user: user._id });
      if (!scoreDoc) continue;
      const matched = checkMatches(scoreDoc.scores, draw.drawnNumbers);
      if (matched.length >= 3) {
        const matchType = matched.length === 5 ? '5-match' : matched.length === 4 ? '4-match' : '3-match';
        winners.push({ user: user._id, matchType, matchedNumbers: matched });
      }
    }

    const fiveWinners = winners.filter(w => w.matchType === '5-match');
    const fourWinners = winners.filter(w => w.matchType === '4-match');
    const threeWinners = winners.filter(w => w.matchType === '3-match');

    const fivePool = draw.prizePools.fiveMatch.total + draw.prizePools.fiveMatch.previousRollover;
    if (fiveWinners.length === 0) {
      draw.prizePools.fiveMatch.rolledOver = true;
    } else {
      const share = fivePool / fiveWinners.length;
      fiveWinners.forEach(w => { w.prizeAmount = share; });
    }

    if (fourWinners.length > 0) {
      const share = draw.prizePools.fourMatch.total / fourWinners.length;
      fourWinners.forEach(w => { w.prizeAmount = share; });
    }
    if (threeWinners.length > 0) {
      const share = draw.prizePools.threeMatch.total / threeWinners.length;
      threeWinners.forEach(w => { w.prizeAmount = share; });
    }

    draw.winners = winners;
    draw.status = 'published';
    draw.publishedAt = new Date();
    await draw.save();

    for (const w of winners) {
      await User.findByIdAndUpdate(w.user, {
        $inc: { 'winnings.total': w.prizeAmount, 'winnings.pendingPayout': w.prizeAmount }
      });
    }

    // Handle jackpot rollover to next month
    if (fiveWinners.length === 0) {
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      await Draw.findOneAndUpdate(
        { month: nextMonth, year: nextYear },
        { $inc: { 'prizePools.fiveMatch.previousRollover': fivePool } },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, draw, winnersCount: winners.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
