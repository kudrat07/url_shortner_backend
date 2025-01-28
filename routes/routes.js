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

const { shortUrlHandler, newUrl, getCount } = require("../controllers/url");

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
router.post("/url", shortUrlHandler);

//routes for getting shortUrl to redirect
router.get("/:shortId", newUrl);

// routes for getting total counts of all
router.get("/total/count", getCount);

module.exports = router;
