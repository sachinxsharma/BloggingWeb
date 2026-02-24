const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');
require('dotenv').config();
const upload = require('express-fileupload');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --------------------
// Body Parsers
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// CORS CONFIG (Production + Development Safe)
// --------------------
const allowedOrigins = [
  "http://localhost:3000", // local dev
  process.env.CLIENT_URL   // production (Vercel)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// --------------------
// File Upload Middleware
// --------------------
app.use(upload());

// --------------------
// Static Folder (Uploads)
// --------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------
// Routes
// --------------------
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// --------------------
// Test Route
// --------------------
app.get('/', (req, res) => {
  res.send('Backend running 🚀');
});

// --------------------
// Error Middleware
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// Database Connection + Server Start
// --------------------
console.log("⏳ Connecting to MongoDB...");

connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch(error => {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  });