// routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    if (products.length === 0) {
      // Seed some default products if empty
      const defaultProducts = [
        { name: "Smart Bulb Pro", price: 29.99, image: "bulb.jpg", category: "Lighting" },
        { name: "Smart Thermostat", price: 129.99, image: "thermostat.jpg", category: "Climate" },
        { name: "Security Camera", price: 89.99, image: "camera.jpg", category: "Security" },
      ];
      await Product.insertMany(defaultProducts);
      return res.json(defaultProducts);
    }
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;