const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Copy .env.example to .env and set it.");
  process.exit(1);
}

const app = require("./app");

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
