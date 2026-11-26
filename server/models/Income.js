const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    source: {
      type: String,
      required: [true, "Please add an income source"],
      trim: true,
      maxlength: [100, "Source cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Please add an amount"],
      min: [0, "Amount must be a positive number"],
    },
    category: {
      type: String,
      required: [true, "Please add a category"],
      enum: [
        "Salary",
        "Freelance",
        "Business",
        "Investment",
        "Rental",
        "Gift",
        "Refund",
        "Other",
      ],
      default: "Other",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Income", incomeSchema);
