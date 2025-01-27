const URL = require("../models/url")
const crypto = require("crypto")

exports.shortUrlHandler = async(req, res) => {
    try {
        const {originalUrl} = req.body;
        if(!originalUrl) {
            return res.status(400).json({
                message:"Original url is required"
            })
        }
        const shortUrl = crypto.randomBytes(4).toString("hex");
        console.log(shortUrl)
        const url = await URL.create({
            shortUrl,
            originalUrl,
            visitHistory: [],
        })
        
        res.status(200).json({
            success: true,
            message:"Short url generated",
            url
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({
            message:"Something went wrong",
            error:error.message
        })
        
    }

}

exports.newUrl = async(req, res) => {
    try {
        const {shortUrl} = req.params;
        const entry = await URL.findOneAndUpdate({shortUrl},
            {
                $push:{
                    visitHistory: {
                        timestamp: new Date().toISOString(),

                    },
                },
            },
        );
        res.redirect(entry.originalUrl);

    } catch (error) {
        res.status(500).json({
            message:"Something went wrong",
            error: error.message,
        })
    }
}

exports.getCount = async (req, res) => {
    try {
      const results = await URL.find(); // This returns an array of documents
  
      if (!results || results.length === 0) {
        return res.status(404).json({
          message: "No URL data found",
        });
      }
  
      console.log("Results: ", results);
  
      // Combine all visit histories into a single array
      const allVisitHistory = results.flatMap((doc) => doc.visitHistory);
  
      // Count the total clicks
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
  
  