const URL = require("../models/url");
const User = require("../models/userSchema");
const crypto = require("crypto");
const useragent = require("useragent");
const { UAParser } = require("ua-parser-js");

const BASE_URL = "https://url-shortner-backend-y538.onrender.com";

exports.shortUrlHandler = async (req, res) => {
  try {
    const { originalUrl, remark, expiryDate } = req.body;
    const { userId } = req.params;
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
    if (!isUser) {
      return res.status(404).json({
        message: "User with this  userId does not exist",
      });
    }
    const userAgent = req.headers["user-agent"];

    console.log("User-Agent:", userAgent);
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const os = result.os.name || "Unknown OS";
    console.log("Operating System:", os);

    let deviceType = result.device.type || "Desktop";
    if (deviceType === "other") {
      deviceType = "Desktop";
    }
    console.log("Device Type:", deviceType);

    const getClientIp = (req) => {
      let ipAddress =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        // If x-forwarded-for contains multiple IPs, use the first one
      if (ipAddress && typeof ipAddress === "string") {
        ipAddress = ipAddress.split(",")[0].trim();
      }

      // Remove potential IPv6 format prefix (::ffff:)
      if (ipAddress.startsWith("::ffff:")) {
        ipAddress = ipAddress.replace("::ffff:", "");
      }

      return ipAddress;
    };

    const ipAddress = getClientIp(req);
    console.log("Client IP:", ipAddress);


    const shortId = crypto.randomBytes(4).toString("hex");
    const shortUrl = `${BASE_URL}/${shortId}`;
    const url = await URL.create({
      shortId,
      shortUrl,
      originalUrl,
      remark,
      userId,
      expiryDate,
      ipAddress,
      os,
      deviceType,
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

    const entry = await URL.findOne({ shortId });

    if (!entry) {
      return res.status(404).json({ message: "URL not found" });
    }

    if (entry.expiryDate && new Date(entry.expiryDate) < new Date()) {
      return res.status(410).json({ message: "Link has expired" });
    }

    const visitHistory = entry.visitHistory;
    if (visitHistory.length > 0) {
      visitHistory[visitHistory.length - 1].count += 1;
    } else {
      visitHistory.push({ timestamp: new Date().toISOString(), count: 1 });
    }

    entry.countOfUrl += 1;

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

    const urlsWithStatus = urls.map((url) => {
      let status = "Active";
      if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
        status = "Inactive";
      }
      return {
        ...url.toObject(),
        status,
      };
    });

    return res.status(200).json({
      success: true,
      urls: urlsWithStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// DELETE A URL
exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Link id is not provided",
      });
    }
    const deletedUrl = await URL.findByIdAndDelete({ _id: id });
    if (!deletedUrl) {
      return res.status(400).json({
        message: "URL not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Link deleted",
      deletedUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while deleting link",
      error: error.message,
    });
  }
};

// GET A PARTICULAR BY ID
exports.getUrl = async (req, res) => {
  try {
    const { urlId } = req.params;
    if (!urlId) {
      return res.status(400).json({
        success: false,
        message: "Url id is required",
      });
    }
    const isUrl = await URL.findById({ _id: urlId });
    if (!isUrl) {
      return res.status(400).json({
        success: false,
        message: "Url doesn't exit",
      });
    }
    res.status(200).json({
      success: true,
      originalUrl: isUrl.originalUrl,
      remark: isUrl.remark,
      expiryDate: isUrl.expiryDate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong while fetching url by Id",
      success: fasle,
      error: error.message,
    });
  }
};

// GET UPDATED COUNT AND STATUS
exports.getUpdated = async (req, res) => {
  try {
    const { shortId } = req.params;

    const entry = await URL.findOne({ shortId });

    if (!entry) {
      return res.status(404).json({ message: "URL not found" });
    }

    // INCREMENT THE COUNT
    entry.countOfUrl += 1;

    //Update the status based on expiry date
    if (entry.expiryDate && new Date(entry.expiryDate) < new Date()) {
      entry.status = "Inactive";
    } else {
      entry.status = "Active";
    }

    // Save the updated entry
    await entry.save();

    res.json({
      countOfUrl: entry.countOfUrl,
      status: entry.status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updatingthe count and status",
      error: error.message,
    });
  }
};
