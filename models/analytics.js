const mongoose = require("mongoose");

const urlAnalyticsSchema = new mongoose.Schema(
  {
    shortUrlId: { type: mongoose.Schema.Types.ObjectId, ref: "URL" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    originalUrl: String,
    shortUrl: String,
    ipAddress: String,
    os: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("urlAnalytics", urlAnalyticsSchema);
