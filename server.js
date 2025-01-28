const express = require("express");
const app = express();
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const PORT = process.env.PORT || 6000;

// MIDDLEWARE TO PARSE JSON
app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send(`<h1>This is homepage</h1>`);
});

const userRouter = require("./routes/routes");
app.use("/api/v1", userRouter);
app.use("/", userRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// db connection call
connectDB()
  .then(() => {
    app.listen(PORT || 6000, () => {
      console.log(`Server is up and running on PORT no ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Something went wrong while connecting to DB");
    console.log(error);
  });
