// models/Permission.js
const mongoose = require("mongoose");

module.exports = mongoose.model("Permission", new mongoose.Schema({
  fileId: mongoose.Schema.Types.ObjectId,
  sharedWith: mongoose.Schema.Types.ObjectId,
  permission: String
}));