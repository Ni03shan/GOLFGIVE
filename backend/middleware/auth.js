require("dotenv").config({ path: "../.env" });
const express = require("express");
const jwt = require('jsonwebtoken');
const User = require('../models/User');
console.log("ENV TEST:", process.env.JWT_SECRET);
console.log(process.env.MONGODB_URI);
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('charity.selected', 'name logo');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (user.subscription.currentPeriodEnd && new Date() > user.subscription.currentPeriodEnd) {
      if (user.subscription.status === 'active') {
        user.subscription.status = 'lapsed';
        await user.save({ validateBeforeSave: false });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

exports.subscriberOnly = (req, res, next) => {
  if (req.user && req.user.subscription.status === 'active') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Active subscription required.' });
};
const SECRET= process.env.JWT_SECRET

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};