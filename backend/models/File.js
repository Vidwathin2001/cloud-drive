const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({

  userId: String,

  fileName: String,

  originalFileName: String,

  fileUrl: String,

  fileSize: Number,

  folderId: String,

  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date,

  version: {
    type: Number,
    default: 1
  }

}, {
  timestamps: true
});

module.exports =
  mongoose.model("File", fileSchema);