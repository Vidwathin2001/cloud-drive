const mongoose = require("mongoose");

module.exports = mongoose.model("Folder", new mongoose.Schema({
  name: String,
  userId: mongoose.Schema.Types.ObjectId,
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  createdAt: { type: Date, default: Date.now }
}));