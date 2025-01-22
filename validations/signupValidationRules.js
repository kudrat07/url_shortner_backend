const { body } = require("express-validator");

const signupValidationRules = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Name must be atleast 3 characters long"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain atleast one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),

  body("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number must be 10 digits long"),
];

module.exports = { signupValidationRules };
