const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: {
    plan: { type: String, enum: ['none', 'basic', 'premium'], default: 'none' },
    status: { type: String, default: 'none' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
});

module.exports = mongoose.model('User', UserSchema);