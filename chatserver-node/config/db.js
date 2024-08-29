const mongoose = require("mongoose");

const DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/chatapp";

mongoose.connect(DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = db;
