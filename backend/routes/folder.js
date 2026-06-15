const router = require("express").Router();
const Folder = require("../models/Folder");
const File = require("../models/File");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

const buildIdMatcher = (id) => {
  if (!id) return id;
  return mongoose.Types.ObjectId.isValid(id)
    ? { $in: [id, new mongoose.Types.ObjectId(id)] }
    : id;
};

router.post("/", auth, async (req, res) => {

  try {

    const folder = await Folder.create({
      name: req.body.name,
      userId: req.userId,
      parentId: req.body.parentId || null
    });

    res.json(folder);

  } catch (err) {

    console.log(err);

    res.status(500).send("Folder create failed");
  }
});

// =====================
// 📂 Get Folders
// =====================

router.get("/", auth, async (req, res) => {

  try {

    const parentId = req.query.parentId;

    console.log("GET /api/folders request - userId:", req.userId, "parentId:", parentId);

    let query = {
      userId: buildIdMatcher(req.userId),
      isDeleted: false
    };

    // ROOT FOLDERS
    if (!parentId || parentId === "null") {
      query.$or = [
        { parentId: null },
        { parentId: { $exists: false } }
      ];
    }

    // INSIDE FOLDER
    else {
      query.parentId = buildIdMatcher(parentId);
    }

    const folders = await Folder.find(query);

    console.log("FOLDERS FOUND COUNT:", folders.length);

    res.json(folders);

  } catch (err) {

    console.log(err);

    res.status(500).send("Error fetching folders");
  }
});

const markFolderContentsDeleted = async (folderId) => {
  await Folder.findByIdAndUpdate(folderId, {
    isDeleted: true,
    deletedAt: new Date()
  });

  await File.updateMany(
    { folderId: buildIdMatcher(folderId), isDeleted: false },
    {
      isDeleted: true,
      deletedAt: new Date()
    }
  );

  const childFolders = await Folder.find({
    parentId: buildIdMatcher(folderId),
    isDeleted: false
  });

  for (const child of childFolders) {
    await markFolderContentsDeleted(child._id);
  }
};

const restoreFolderContents = async (folderId) => {
  await Folder.findByIdAndUpdate(folderId, {
    isDeleted: false,
    deletedAt: null
  });

  await File.updateMany(
    { folderId: buildIdMatcher(folderId), isDeleted: true },
    { isDeleted: false, deletedAt: null }
  );

  const childFolders = await Folder.find({
    parentId: buildIdMatcher(folderId),
    isDeleted: true
  });

  for (const child of childFolders) {
    await restoreFolderContents(child._id);
  }
};

const deleteFolderRecursively = async (folderId) => {
  await File.deleteMany({ folderId: buildIdMatcher(folderId) });

  const childFolders = await Folder.find({ parentId: buildIdMatcher(folderId) });
  for (const child of childFolders) {
    await deleteFolderRecursively(child._id);
  }

  await Folder.findByIdAndDelete(folderId);
};

// =====================
// 🗑 Recycle Bin Folders
// =====================

router.get("/recycle", auth, async (req, res) => {
  try {
    const folders = await Folder.find({
      userId: buildIdMatcher(req.userId),
      isDeleted: true
    });

    res.json(folders);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching recycle folders");
  }
});

// =====================
// 🔎 Recent Folders
// =====================

router.get("/recent", auth, async (req, res) => {
  try {
    const folders = await Folder.find({
      userId: buildIdMatcher(req.userId),
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(folders);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching recent folders");
  }
});

// =====================
// 🗑 Delete Folder
// =====================

router.delete("/:id", auth, async (req, res) => {
  try {
    await markFolderContentsDeleted(req.params.id);
    res.send("Folder deleted");
  } catch (err) {
    console.log(err);
    res.status(500).send("Delete failed");
  }
});

router.delete("/permanent/:id", auth, async (req, res) => {
  try {
    await deleteFolderRecursively(req.params.id);
    res.send("Permanently deleted");
  } catch (err) {
    console.log(err);
    res.status(500).send("Permanent delete failed");
  }
});

router.post("/permanent", auth, async (req, res) => {
  try {
    const ids = req.body.ids || [];

    for (const id of ids) {
      await deleteFolderRecursively(id);
    }

    res.send("Permanently deleted");
  } catch (err) {
    console.log(err);
    res.status(500).send("Permanent delete failed");
  }
});

router.post("/restore", auth, async (req, res) => {
  try {
    const ids = req.body.ids || [];

    for (const id of ids) {
      await restoreFolderContents(id);
    }

    res.send("Restored");
  } catch (err) {
    console.log(err);
    res.status(500).send("Restore failed");
  }
});

module.exports = router;