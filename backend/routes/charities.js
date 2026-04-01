const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search, category, featured } = req.query;
    const query = { isActive: true };
    if (featured === 'true') query.isFeatured = true;
    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const charities = await Charity.find(query).sort({ isFeatured: -1, subscriberCount: -1 });
    res.json({ success: true, charities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found.' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const charity = await Charity.create(req.body);
    res.status(201).json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!charity) return res.status(404).json({ success: false, message: 'Charity not found.' });
    res.json({ success: true, charity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Charity.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Charity deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/me/select', protect, async (req, res) => {
  try {
    const { charityId, contributionPercentage } = req.body;
    const user = await User.findById(req.user._id);

    // Decrement old charity subscriber count
    if (user.charity.selected) {
      await Charity.findByIdAndUpdate(user.charity.selected, { $inc: { subscriberCount: -1 } });
    }

    user.charity.selected = charityId;
    if (contributionPercentage) {
      user.charity.contributionPercentage = Math.max(10, Math.min(100, contributionPercentage));
    }
    await user.save({ validateBeforeSave: false });

    await Charity.findByIdAndUpdate(charityId, { $inc: { subscriberCount: 1 } });

    res.json({ success: true, charity: user.charity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
