require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Webhook must come BEFORE express.json() for raw body
app.post('/webhook', express.raw({type: 'application/json'}), require('./webhook'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/iot', require('./routes/iot'));

// Simulated MQTT log
console.log('MQTT Simulator Active → Check console when controlling devices');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));