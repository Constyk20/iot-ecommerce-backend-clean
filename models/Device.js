// models/Device.js
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  deviceId: { type: String, required: true, unique: true }, // e.g., bulb-001
  type: { type: String, enum: ['bulb', 'sensor', 'thermostat'], default: 'bulb' },
  status: { type: String, default: 'off' }, // on / off
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);