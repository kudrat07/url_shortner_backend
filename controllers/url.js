const URL = require("../models/url");
const User = require("../models/userSchema");
const crypto = require("crypto");
const useragent = require("useragent");
const { UAParser } = require("ua-parser-js");

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

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const os = result.os.name || "Unknown OS";

    let deviceType = result.device.type || "Desktop";
    if (deviceType === "other") {
      deviceType = "Desktop";
    }

    const getClientIp = (req) => {
      let ipAddress =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      // Extract the first IP from x-forwarded-for if present
      if (ipAddress && typeof ipAddress === "string") {
        ipAddress = ipAddress.split(",")[0].trim();
      }

      // Remove IPv6 prefix (::ffff:) if present
      if (ipAddress.startsWith("::ffff:")) {
        ipAddress = ipAddress.replace("::ffff:", "");
      }

      return ipAddress;
    };

    // Usage
    const ipAddress = getClientIp(req);
    console.log("Client's IP Address:", ipAddress);

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

// Redirect to original url using shortURL
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

// GET UPDATED COUNT AND STATUS

// exports.getUpdated = async (req, res) => {
//   try {
//     const { shortId } = req.params;

//     const entry = await URL.findOne({ shortId });

//     if (!entry) {
//       return res.status(404).json({ message: "URL not found" });
//     }

//     // INCREMENT THE COUNT
//     entry.countOfUrl += 1;

//     //Update the status based on expiry date
//     if (entry.expiryDate && new Date(entry.expiryDate) < new Date()) {
//       entry.status = "Inactive";
//     } else {
//       entry.status = "Active";
//     }

//     // Save the updated entry
//     await entry.save();

//     res.json({
//       countOfUrl: entry.countOfUrl,
//       status: entry.status,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error updatingthe count and status",
//       error: error.message,
//     });
//   }
// };

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



exports.getCount = async (req, res) => {
  try {
    const userId = req.params.userId; 
    const results = await URL.find({ userId: userId }); 

    if (!results || results.length === 0) {
      return res.status(200).json({});
    }

    const totalCounts = results.reduce((sum, doc) => sum + doc.countOfUrl, 0);

    const deviceCounts = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };

    const dateWiseClicks = {};

    const getDeviceType = (userAgent) => {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      if (result.device.type === "mobile") return "mobile";
      else if (result.device.type === "tablet") return "tablet";
      return "desktop";
    };

    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0'); 
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    results.forEach((doc) => {
      doc.visitHistory.forEach((visit) => {
        const deviceType = visit.deviceType || "other";
        const visitDate = formatDate(visit.timestamp); 

        if (dateWiseClicks[visitDate]) {
          dateWiseClicks[visitDate] += visit.count;
        } else {
          dateWiseClicks[visitDate] = visit.count;
        }

        if (deviceType === "other") {
          deviceCounts[getDeviceType(req.headers["user-agent"])] += visit.count;
        } else {
          if (deviceCounts.hasOwnProperty(deviceType)) {
            deviceCounts[deviceType] += visit.count;
          } else {
            deviceCounts.other += visit.count;
          }
        }
      });
    });

    const dateWiseClickArray = Object.entries(dateWiseClicks)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const last5DateWiseClickArray = dateWiseClickArray.slice(0, 5);

    let cumulativeClicks = 0;
    const dateWiseClickWithCumulative = last5DateWiseClickArray.map(entry => {
      cumulativeClicks += entry.count;
      return {
        ...entry,
        cumulativeClicks,
      };
    });

    const allVisitHistory = results.flatMap((doc) => doc.visitHistory);

    // Convert deviceCounts object to an array format
    const deviceCountArray = Object.entries(deviceCounts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
    }));

    res.status(200).json({
      success: true,
      totalCounts,
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



