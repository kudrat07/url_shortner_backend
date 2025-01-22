const mongoose = require("mongoose");
require("dotenv").config();

const DB_URI=process.env.DB_URI;

const connectDB = async () => {
    mongoose.connect(DB_URI, {

    }).then(() => {
        console.log("DB connection successful");
    }).catch((error)=>{
        console.log("Issue in DB connection");
        console.log(error);
        process.exit(1);
    })
}

module.exports = connectDB;