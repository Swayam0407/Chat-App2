const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderName: String,
  receiverName: String,
  message: String,
  status: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema,"mssgs");

module.exports = Message;
