const router = require("express").Router();
const multer = require("multer");
const upload = multer();
const path = require("path");

const auth = require("../middleware/auth");
const File = require("../models/File");
const Permission = require("../models/Permission");
const { uploadFile } = require("../utils/s3");
const User = require("../models/User");
const mongoose = require("mongoose");

const buildIdMatcher = (id) => {
  if (!id) return id;
  return mongoose.Types.ObjectId.isValid(id)
    ? { $in: [id, new mongoose.Types.ObjectId(id)] }
    : id;
};

// =====================
// 📤 Upload File
// =====================

router.post(
  "/upload",
  auth,
  upload.single("file"),
  async (req, res) => {

    try {

      const url =
        await uploadFile(req.file);

      // latest version
      const existing =
        await File.findOne({

          userId: buildIdMatcher(req.userId),

          originalFileName:
            req.file.originalname

        }).sort({ version: -1 });

      const file = await File.create({

        userId: req.userId,

        fileName:
          req.file.originalname,

        originalFileName:
          req.file.originalname,

        fileUrl: url,

        fileSize:
          req.file.size,

        folderId:
          req.body.folderId &&
          req.body.folderId !== "null"
            ? req.body.folderId
            : null,

        version:
          existing
            ? existing.version + 1
            : 1
      });

      res.json(file);

    } catch (err) {

      console.log(err);

      res.status(500).send(
        "Upload failed"
      );
    }
  }
);

// =====================
// REPLACE FILE
// =====================

router.put(
  "/replace/:id",
  auth,
  upload.single("file"),
  async (req, res) => {

    try {

      const url =
        await uploadFile(req.file);

      const updated =
        await File.findByIdAndUpdate(

          req.params.id,

          {
            fileUrl: url,

            fileSize:
              req.file.size,

            createdAt:
              new Date()
          },

          { new: true }
        );

      res.json(updated);

    } catch (err) {

      console.log(err);

      res.status(500).send(
        "Replace failed"
      );
    }
  }
);



// =====================
// 📂 Get Files
// =====================

router.get("/", auth, async (req, res) => {

  try {

    const folderId = req.query.folderId;

    console.log("GET /api/files request - userId:", req.userId, "folderId:", folderId);

    let query = {
      userId: buildIdMatcher(req.userId),
      isDeleted: false
    };

    // ROOT FILES
    if (!folderId || folderId === "null") {
      query.$or = [
        { folderId: null },
        { folderId: { $exists: false } }
      ];
    }

    // INSIDE FOLDER
    else {
      query.folderId = buildIdMatcher(folderId);
    }

    console.log("FILES QUERY:", query);

    const files = await File.find(query);

    console.log("FILES FOUND COUNT:", files.length);

    res.json(files);

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "Error fetching files"
    );
  }
});

router.get("/recycle", auth, async (req, res) => {
  try {
    const files = await File.find({
      userId: buildIdMatcher(req.userId),
      isDeleted: true
    });

    res.json(files);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching recycle items");
  }
});

// =====================
// 🔎 Recent Files
// =====================

router.get("/recent", auth, async (req, res) => {
  try {
    const files = await File.find({
      userId: buildIdMatcher(req.userId),
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(files);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching recent files");
  }
});


// =====================
// 🔗 Share File
// =====================

router.post("/share", auth, async (req, res) => {

  try {

    const {
      fileId,
      email
    } = req.body;

    const user =
      await User.findOne({ email });

    if (!user) {

      return res
        .status(404)
        .send("User not found");
    }

    console.log("SHARE fileId:", fileId, "to user._id:", user._id);

    await Permission.create({

      fileId,

      sharedWith: user._id,

      permission: "read"
    });

    console.log("Permission created for file", fileId);

    res.send("Shared");

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "Error sharing file"
    );
  }
});


// =====================
// 🗑 Delete File
// =====================
router.delete("/:id", auth, async (req, res) => {
  try {
    await File.findByIdAndUpdate(req.params.id, {
      isDeleted: true,
      deletedAt: new Date()
    });
    res.send("Deleted");
  } catch (err) {
    res.status(500).send("Delete failed");
  }
});

router.delete("/permanent/:id", auth, async (req, res) => {
  try {
    await File.findByIdAndDelete(req.params.id);
    res.send("Permanently deleted");
  } catch (err) {
    res.status(500).send("Permanent delete failed");
  }
});

router.post("/permanent", auth, async (req, res) => {
  try {
    const ids = req.body.ids || [];

    await File.deleteMany({
      _id: { $in: ids }
    });

    res.send("Permanently deleted");
  } catch (err) {
    console.log(err);
    res.status(500).send("Permanent delete failed");
  }
});

router.post("/restore", auth, async (req, res) => {
  try {
    const ids = req.body.ids || [];

    await File.updateMany(
      { _id: { $in: ids } },
      { isDeleted: false, deletedAt: null }
    );

    res.send("Restored");
  } catch (err) {
    console.log(err);
    res.status(500).send("Restore failed");
  }
});

// =====================
// ✏ Rename File
// =====================
router.put("/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).send("File not found");
    }

    const newName = String(req.body.name || "").trim();

    if (!newName) {
      return res.status(400).send("Invalid file name");
    }

    const currentExt = path.extname(file.fileName);
    const newExt = path.extname(newName);
    const updatedName = newExt || currentExt ? newName + (!newExt ? currentExt : "") : newName;

    const updatedFile = await File.findByIdAndUpdate(
      req.params.id,
      { fileName: updatedName },
      { new: true }
    );

    res.json(updatedFile);
  } catch (err) {
    res.status(500).send("Rename failed");
  }
});

// =====================
// 📥 GET SHARED FILES
// =====================

router.get("/shared/me", auth, async (req, res) => {

  try {

    const permissions = await Permission.find({
      sharedWith: buildIdMatcher(req.userId)
    });

    console.log("SHARED permissions count:", permissions.length);

    const fileIds =
      permissions.map((p) => p.fileId);

    console.log("SHARED fileIds:", fileIds);

    const files =
      await File.find({
        _id: { $in: fileIds }
      });

    console.log("SHARED files found:", files.length);

    const sharedFiles =
      await Promise.all(

        files.map(async (file) => {

          const permission =
            permissions.find(
              (p) =>
                p.fileId.toString() ===
                file._id.toString()
            );

          const sender =
            await User.findById(
              file.userId
            );

          return {

            ...file.toObject(),

            senderName:
              sender?.name ||

              sender?.email ||

              "Unknown User",

            sharedAt:
              permission.createdAt
          };
        })
      );

    res.json(sharedFiles);

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "Error fetching shared files"
    );
  }
});

router.post("/copy", auth, async (req, res) => {

  try {

    const {
      fileId,
      targetFolder
    } = req.body;

    const file =
      await File.findById(fileId);

    const copied =
      await File.create({

        userId: req.userId,

        fileName:
          file.fileName,

        originalFileName:
          file.originalFileName,

        fileUrl:
          file.fileUrl,

        fileSize:
          file.fileSize,

        folderId:
          targetFolder
      });

    res.json(copied);

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "Copy failed"
    );
  }
});

router.put("/move/:id", auth, async (req, res) => {

  try {

    const updated =
      await File.findByIdAndUpdate(

        req.params.id,

        {
          folderId:
            req.body.folderId
        },

        { new: true }
      );

    res.json(updated);

  } catch (err) {

    console.log(err);

    res.status(500).send(
      "Move failed"
    );
  }
});

module.exports = router;