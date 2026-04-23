const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* ---------------- CLOUDINARY CONFIG ---------------- */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // ✅ FIXED
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ---------------- CLOUDINARY TEST ---------------- */
function testCloudinary() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME || // ✅ FIXED
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.log("❌ Cloudinary ENV missing");
  } else {
    console.log("☁️ Cloudinary config loaded");
  }
}
testCloudinary();

/* ---------------- MONGODB CONNECT ---------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("📦 Database ready on Render");
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed:");
    console.log(err.message);
  });

/* ---------------- MONGOOSE SCHEMA ---------------- */
const productSchema = new mongoose.Schema({
  name: String,
  priceNumber: Number,
  priceText: String,
  phone: String,
  location: String,
  category: String,
  images: [String],
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

/* ---------------- UPLOAD FUNCTION ---------------- */
async function uploadToCloudinary(base64Image) {
  console.log("⬆️ Uploading image to Cloudinary...");

  const result = await cloudinary.uploader.upload(base64Image, {
    folder: "ourmarket_products",
  });

  console.log("✅ Image uploaded:", result.secure_url);
  return result.secure_url;
}

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send({
    status: "Server running 🚀",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "not connected",
  });
});

/* ---------------- ROUTE ---------------- */
app.post("/api/products", async (req, res) => {
  try {
    console.log("📥 New product request received");

    const {
      name,
      priceNumber,
      priceText,
      phone,
      location,
      category,
      images,
      createdAt,
    } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const uploadedImages = [];

    for (let img of images) {
      const url = await uploadToCloudinary(img);
      uploadedImages.push(url);
    }

    const product = new Product({
      name,
      priceNumber,
      priceText,
      phone,
      location,
      category,
      images: uploadedImages,
      createdAt,
    });

    await product.save();

    console.log("💾 Product saved to MongoDB:", product._id);

    res.status(201).json({
      message: "Product uploaded successfully",
      product,
    });
  } catch (err) {
    console.log("❌ Server error:", err.message);

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
  console.log("🌍 Ready for Render deployment");
});