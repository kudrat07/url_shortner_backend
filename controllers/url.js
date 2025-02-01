const URL = require("../models/url");
const urlAnalytics = require("../models/analytics");
// const useragent = require("useragent");
const User = require("../models/userSchema");
const crypto = require("crypto");
const { UAParser } = require("ua-parser-js");
const useragent = require("user-agent");

const BASE_URL = "https://url-shortner-backend-y538.onrender.com";

// Generate short URL and short Id
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
        message: "Original URL and remark are required",
      });
    }

    const isUser = await User.findById({ _id: userId });
    if (!isUser) {
      return res.status(404).json({
        message: "User with this userId does not exist",
      });
    }

    // Parse the User-Agent for OS and device detection
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const os = result.os.name || "Unknown OS";

    // Improved device type detection with a fallback
    let deviceType = result.device.type || "Desktop";

    // Ensure valid device type value
    if (deviceType === "other" || !deviceType) {
      deviceType = "Desktop";
    }

    // IP extraction function
    const getClientIp = (req) => {
      let ipAddress =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      if (ipAddress && typeof ipAddress === "string") {
        ipAddress = ipAddress.split(",")[0].trim();
      }

      if (ipAddress.startsWith("::ffff:")) {
        ipAddress = ipAddress.replace("::ffff:", "");
      }

      return ipAddress;
    };

    const ipAddress = getClientIp(req);
    console.log("Client's IP Address:", ipAddress);

    // Generate a random shortId
    const shortId = crypto.randomBytes(4).toString("hex");
    const shortUrl = `${BASE_URL}/${shortId}`;

    // Save URL entry with device type
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
      message: "Short URL generated successfully",
      url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong in shortening the URL",
      error: error.message,
    });
  }
};

// GET ALL URL
exports.getAllUrls = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        message: "Please provide id",
      });
    }
    const urls = await URL.find({ userId });
    if (!urls || urls.length === 0) {
      return res.status(200).json({
        urls: [],
      });
    }

    const formatDate = (date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const newDate = new Date(date);
      const month = months[newDate.getMonth()];
      const day = newDate.getDate();
      const year = newDate.getFullYear();
      let hours = newDate.getHours();
      const minutes = newDate.getMinutes().toString().padStart(2, "0");
      const isAM = hours < 12;

      if (hours > 12) hours -= 12; // Convert to 12-hour format
      if (hours === 0) hours = 12; // If hours is 0, set it to 12 (midnight)
      const period = isAM ? "AM" : "PM";

      return `${month} ${day}, ${year} ${hours}:${minutes} ${period}`;
    };

    const urlsWithStatus = urls.map((url) => {
      let status = "Active";
      if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
        status = "Inactive";
      }

      return {
        ...url.toObject(),
        status,
        createdAt: formatDate(url.createdAt),
        updatedAt: formatDate(url.updatedAt),
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

// GET A PARTICULAR URL BY ID
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

// UPDATE A URL
exports.updateUrl = async (req, res) => {
  try {
    const { urlId } = req.params;
    let { originalUrl, remark, expiryDate } = req.body;

    if (!urlId) {
      return res.status(400).json({
        message: "URL id is not provided",
      });
    }

    if (!expiryDate) {
      expiryDate = null;
    }

    const updatedUrl = await URL.findByIdAndUpdate(
      urlId,
      { originalUrl, remark, expiryDate },
      { new: true, runValidators: true }
    );

    if (!updatedUrl) {
      return res.status(404).json({
        message: "URL not found",
      });
    }

    return res.status(200).json({
      message: "URL updated successfully",
      updatedUrl,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//GET TOTAL COUUNTS, DATE WISE COUNTS, DEVICE WISE COUNTS
exports.getCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    const results = await URL.find({ userId: userId });

    if (!results || results.length === 0) {
      return res.status(200).json({});
    }

    // Initialize device counts for desktop, mobile, and tablet
    const deviceCounts = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };

    const dateWiseClicks = {};

    // Function to format the date for visit history
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Loop through the URLs and accumulate counts based on deviceType
    results.forEach((doc) => {
      const deviceType = doc.deviceType;

      // Loop through the visit history to accumulate counts
      doc.visitHistory.forEach((visit) => {
        const visitDate = formatDate(visit.timestamp);

        if (dateWiseClicks[visitDate]) {
          dateWiseClicks[visitDate] += visit.count;
        } else {
          dateWiseClicks[visitDate] = visit.count;
        }

        if (deviceType === "Desktop") {
          deviceCounts.desktop += visit.count;
        } else if (deviceType === "mobile") {
          deviceCounts.mobile += visit.count;
        } else if (deviceType === "tablet") {
          deviceCounts.tablet += visit.count;
        }
      });
    });

    const dateWiseClickArray = Object.entries(dateWiseClicks)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const last5DateWiseClickArray = dateWiseClickArray.slice(0, 5);

    let cumulativeClicks = 0;
    const dateWiseClickWithCumulative = last5DateWiseClickArray.map((entry) => {
      cumulativeClicks += entry.count;
      return {
        ...entry,
        cumulativeClicks,
      };
    });

    const allVisitHistory = results.flatMap((doc) => doc.visitHistory);

    // Convert deviceCounts object to an array format and include all device counts
    const deviceCountArray = Object.entries(deviceCounts).map(
      ([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      })
    );

    res.status(200).json({
      success: true,
      totalCounts: results.reduce((sum, doc) => sum + doc.countOfUrl, 0),
      deviceCounts: deviceCountArray,
      dateWiseClicks: dateWiseClickWithCumulative,
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

// GET ANALYTICS OF VISITED LINKS
exports.getAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is not provided",
      });
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User doesn't exist",
      });
    }

    const analyticsData = await urlAnalytics.find({ userId });

    if (!analyticsData || analyticsData.length === 0) {
      return res.status(200).json({
        analyticsData: [],
      });
    }

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedData = analyticsData.map((entry) => {
      if (!entry.createdAt)
        return { ...entry._doc, formattedDate: "No timestamp available" };

      const date = new Date(entry.createdAt);
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();

      // Time formatting in 12-hour format with AM/PM
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const amPm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // Convert to 12-hour format

      const formattedDate = `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${amPm}`;

      return {
        ...entry._doc,
        formattedDate,
      };
    });

    res.status(200).json({
      success: true,
      analyticsData: formattedData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// REDIRECT TO ORIGINAL URL USING SHORT URL
exports.newUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    // Find the URL entry by shortId
    const entry = await URL.findOne({ shortId });

    if (!entry) {
      return res.status(404).json({ message: "URL not found" });
    }

    if (entry.expiryDate && new Date(entry.expiryDate) < new Date()) {
      return res.status(410).json({ message: "Link has expired" });
    }

    if (req.originalUrl.includes("favicon.ico")) {
      return res.status(204).end();
    }

    // Parse user-agent to detect the device
    const userAgent = req.headers["user-agent"];
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const os = result.os.name || "Unknown OS";

    let deviceType = "Desktop";
    if (result.device.type === "mobile" || result.device.type === "tablet") {
      deviceType = "Mobile";
    }

    const getClientIp = (req) => {
      let ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      if (ipAddress && typeof ipAddress === "string") {
        ipAddress = ipAddress.split(",")[0].trim();
      }
      if (ipAddress.startsWith("::ffff:")) {
        ipAddress = ipAddress.replace("::ffff:", "");
      }
      return ipAddress;
    };

    const ipAddress = getClientIp(req);

    // Log unique visit using device type and IP for accurate analytics
    const visitLogData = {
      shortUrlId: entry._id,
      ipAddress,
      os,
      deviceType,
      timestamp: { $gte: new Date(Date.now() - 3000) }, // Detect duplicate visits within a 3-second window
    };

    const visitExists = await urlAnalytics.exists(visitLogData);

    if (!visitExists) {
      // Save the visit log entry
      const visitLog = new urlAnalytics({
        shortUrlId: entry._id,
        originalUrl: entry.originalUrl,
        shortUrl: entry.shortUrl,
        userId: entry.userId,
        ipAddress,
        os,
        deviceType,
        timestamp: new Date(),
      });

      await visitLog.save();

      // Use transactions to guarantee count accuracy
      const session = await URL.startSession();
      session.startTransaction();

      try {
        // Update URL visit count and ensure atomicity
        await URL.findByIdAndUpdate(
          entry._id,
          {
            $inc: {
              countOfUrl: 1,
              [deviceType === "Desktop" ? "desktopClickCount" : "mobileClickCount"]: 1,
            },
            $push: { visitHistory: { timestamp: new Date().toISOString(), count: 1 } },
          },
          { new: true, session }
        );

        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }

    res.redirect(entry.originalUrl);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};







