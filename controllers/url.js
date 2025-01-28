const URL = require("../models/url");
const User = require("../models/userSchema");
const crypto = require("crypto");
// const BASE_URL = "localhost:8080";
const BASE_URL = "https://url-shortner-backend-y538.onrender.com";

exports.shortUrlHandler = async (req, res) => {
  try {
    const { originalUrl, remark } = req.body;
    const { userId } = req.params;
    console.log(userId);
    if (!userId) {
      return res.status(400).json({
        message: "Please provide user Id",
      });
    }
    if (!originalUrl || !remark) {
      return res.status(400).json({
        message: "Original url is required",
      });
    }
    const isUser = await User.findById({ _id: userId });
    console.log(isUser);
    if (!isUser) {
      return res.status(404).json({
        message: "User with this  userId does not exist",
      });
    }
    const shortId = crypto.randomBytes(4).toString("hex");
    console.log(shortId);
    const shortUrl = `${BASE_URL}/${shortId}`;
    const url = await URL.create({
      shortId,
      shortUrl,
      originalUrl,
      remark,
      userId,
      visitHistory: [],
    });

    res.status(200).json({
      success: true,
      message: "Short url generated",
      url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong in shortening url",
      error: error.message,
    });
  }
};

exports.newUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    // Find the URL document by shortId
    const entry = await URL.findOne({ shortId });

    if (!entry) {
      return res.status(404).json({ message: "URL not found" });
    }

    // Increment count for the last visit or create a new visit entry
    const visitHistory = entry.visitHistory;
    if (visitHistory.length > 0) {
      // Increment count for the last visit
      visitHistory[visitHistory.length - 1].count += 1;
    } else {
      // Add a new visit entry
      visitHistory.push({ timestamp: new Date().toISOString(), count: 1 });
    }

    // Save the updated document
    await entry.save();

    res.redirect(entry.originalUrl);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getCount = async (req, res) => {
  try {
    const results = await URL.find();

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "No URL data found",
      });
    }

    const allVisitHistory = results.flatMap((doc) => doc.visitHistory);

    const totalClicks = allVisitHistory.length;

    res.status(200).json({
      success: true,
      totalClicks,
      analytics: allVisitHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getAllUrls = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        message: "Please provide id",
      });
    }
    const urls = await URL.find({ userId });
    if (!urls) {
      return res.status(200).json({
        urls: [],
      });
    }
    return res.status(200).json({
      success: true,
      urls,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
