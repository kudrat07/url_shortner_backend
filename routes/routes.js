const express = require("express");
const router = express.Router();

const{signup, login, getUser} = require("../controllers/user");

const {signupValidationRules} = require("../validations/signupValidationRules");

const {loginValidationRules} = require("../validations/loginValidationRules");

const {handleValidation} = require("../middlewares/handleValidation");



//ROUTES FOR SIGN UP
router.post("/signup", signupValidationRules, handleValidation, signup)

//ROUTES FOR LOGIN
router.post("/login", loginValidationRules, handleValidation, login)

//ROUTES FOR USER DETAILS
router.get("/user", getUser)

module.exports=router;