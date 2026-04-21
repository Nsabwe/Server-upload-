const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json({ limit: "50mb" })); // important for base64 images

// ---------------- MONGODB CONNECT ----------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ---------------- PRODUCT SCHEMA ----------------
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  phone: String,
  location: String,
  category: String,
  images: [String], // base64 images
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

// ---------------- ROUTES ----------------

// POST product
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, phone, location, category, images } = req.body;

    if (!name || !price || !images || images.length === 0) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newProduct = new Product({
      name,
      price,
      phone,
      location,
      category,
      images,
    });

    await newProduct.save();

    res.status(201).json({
      message: "Product uploaded successfully",
      product: newProduct,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET products (for feed page later)
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});