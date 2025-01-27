const URL = require("../models/url");
const crypto = require("crypto");

exports.shortUrlHandler = async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) {
      return res.status(400).json({
        message: "Original url is required",
      });
    }
    const shortUrl = crypto.randomBytes(4).toString("hex");
    console.log(shortUrl);
    const url = await URL.create({
      shortUrl,
      originalUrl,
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
    const { shortUrl } = req.params;

    // Find the URL document by shortUrl
    const entry = await URL.findOne({ shortUrl });

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
