const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    shortUrl: {
      type: String,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remark: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Active",
    },
    expiryDate: {
      type: Date,
    },
    countOfUrl: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    deviceType: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    visitHistory: [
      {
        timestamp: { type: String, default: () => new Date().toISOString() },
        count: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const URL = mongoose.model("url", urlSchema);
module.exports = URL;
