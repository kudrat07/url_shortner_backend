const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getUser,
  deleteUser,
  updateUser,
} = require("../controllers/user");

const {
  signupValidationRules,
} = require("../validations/signupValidationRules");

const { loginValidationRules } = require("../validations/loginValidationRules");

const { handleValidation } = require("../middlewares/handleValidation");

const {
  shortUrlHandler,
  newUrl,
  getCount,
  getAllUrls,
  deleteUrl,
  getUrl,
  updateUrl,
  getAnalytics,
} = require("../controllers/url");

//ROUTES FOR SIGN UP
router.post("/signup", signupValidationRules, handleValidation, signup);

//ROUTES FOR LOGIN
router.post("/login", loginValidationRules, handleValidation, login);

//ROUTES FOR USER DETAILS
router.get("/user", getUser);

//ROUTES FOR DELETE USER
router.delete("/delete/:id", deleteUser);
//ROUTES FOR UPDATED USER
router.put("/update/:id", updateUser);

// * ROUTES FOR LINKS
router.post("/url/:userId", shortUrlHandler);

//routes for getting shortUrl to redirect
router.get("/:shortId", newUrl);

// routes for getting total counts of all
router.get("/count/:userId", getCount);

//routes for getting all urls
router.get("/allUrls/:userId", getAllUrls);

//routes for deleting a url
router.delete("/delete/url/:id", deleteUrl)

//routes for getting a specific url
router.get("/url/:urlId", getUrl)

//routes to get updated count and status
// router.get("/visit/:shortId", getUpdated)

//routes to update a specific url
router.put("/updateUrl/:urlId", updateUrl)

//routes for get analytics
router.get("/analytics/:userId", getAnalytics)

module.exports = router;
