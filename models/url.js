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
    remark:{
      type:String,
      required: true,
    },
    expiryDate:{
      type: Date,
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
