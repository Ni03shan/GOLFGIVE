const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Score = require('../models/Score');
const { protect, subscriberOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user._id });
    res.json({ success: true, scores: scoreDoc ? scoreDoc.scores : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, subscriberOnly, [
  body('value').isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
  body('date').isISO8601().withMessage('Valid date required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { value, date, course } = req.body;
    const scoreDoc = await Score.addScore(req.user._id, { value, date, course });
    res.status(201).json({ success: true, scores: scoreDoc.scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:scoreId', protect, subscriberOnly, [
  body('value').optional().isInt({ min: 1, max: 45 }).withMessage('Score must be between 1 and 45'),
  body('date').optional().isISO8601().withMessage('Valid date required')
], async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) return res.status(404).json({ success: false, message: 'No scores found.' });

    const scoreEntry = scoreDoc.scores.id(req.params.scoreId);
    if (!scoreEntry) return res.status(404).json({ success: false, message: 'Score entry not found.' });

    if (req.body.value !== undefined) scoreEntry.value = req.body.value;
    if (req.body.date !== undefined) scoreEntry.date = req.body.date;
    if (req.body.course !== undefined) scoreEntry.course = req.body.course;

    await scoreDoc.save();
    res.json({ success: true, scores: scoreDoc.scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:scoreId', protect, subscriberOnly, async (req, res) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user._id });
    if (!scoreDoc) return res.status(404).json({ success: false, message: 'No scores found.' });

    scoreDoc.scores.pull(req.params.scoreId);
    await scoreDoc.save();
    res.json({ success: true, scores: scoreDoc.scores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
