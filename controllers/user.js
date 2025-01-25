const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Sign Up

exports.signup = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    // checking if email is already registered
    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // If email is not registered then hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
    });


    res.status(201).json({
      success: true,
      message: "Sign up successfull",
      username: user.name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// Login

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not found",
      });
    }

    //If email exist then compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: "false",
        message: "Incorrect password",
      });
    }

    console.log(user.name)

    //If password match then create jwt token
    const token = jwt.sign(
      { id: user._id, userName:user.name },
      process.env.JWT_SECRET
    );
        res.status(200).json({
      success: true,
      message: "Login successful! Welcome back!",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// get user details
exports.getUser = async(req, res) => {
  try{
    const token = req.headers['authorization'];
    console.log(token)
    if(!token){
      return res.status(400).json({
        success:false,
        message:"No token provided",
      })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded)
    const name = decoded.userName;
    const id = decoded.id;
    console.log(name, id)
    res.status(200).json({
      success:true,
      id:id,
      name:name
    })
  } catch(error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later",
    })
  }
}
