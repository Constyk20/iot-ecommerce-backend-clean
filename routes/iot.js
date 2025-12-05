// routes/iot.js
const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const auth = require('./middleware/auth');

// Register new device
router.post('/register', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const deviceCount = await Device.countDocuments({ user: req.user.id });

    // Free = 1 device, Basic = 3, Premium = unlimited
    const limit = user.subscription.plan === 'premium' ? 999 : user.subscription.plan === 'basic' ? 3 : 1;
    if (deviceCount >= limit) {
      return res.status(403).json({ msg: `Upgrade to add more devices (Limit: ${limit})` });
    }

    const { name, deviceId, type } = req.body;
    const device = new Device({ user: req.user.id, name, deviceId, type });
    await device.save();

    user.devices.push(device._id);
    await user.save();

    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my devices
router.get('/my-devices', auth, async (req, res) => {
  const devices = await Device.find({ user: req.user.id });
  res.json(devices);
});

// Control device (simulated MQTT)
router.post('/control', auth, async (req, res) => {
  try {
    const { deviceId, command } = req.body; // command: "on" or "off"
    const device = await Device.findOne({ deviceId, user: req.user.id });

    if (!device) return res.status(404).json({ msg: 'Device not found' });

    device.status = command;
    device.lastSeen = Date.now();
    await device.save();

    // SIMULATED MQTT PUBLISH (in real project you'd connect to broker)
    console.log(`MQTT → Topic: devices/${deviceId} | Payload: ${command}`);

    res.json({ success: true, status: command });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
