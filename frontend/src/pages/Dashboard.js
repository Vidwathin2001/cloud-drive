import { useEffect, useState } from "react";
import { API } from "../api";

import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileVideo,
  FaFileArchive,
  FaFileAlt
} from "react-icons/fa";

export default function Dashboard() {

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderHistory, setFolderHistory] = useState([]);
  const [currentFolderName, setCurrentFolderName] = useState("My Drive");

  const [view, setView] = useState("grid");

  const [menu, setMenu] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [showShared, setShowShared] = useState(false);
  const [showRecycle, setShowRecycle] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [recycleFiles, setRecycleFiles] = useState([]);
  const [recycleFolders, setRecycleFolders] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [recentFilesList, setRecentFilesList] = useState([]);
  const [recentFoldersList, setRecentFoldersList] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [clipboardAction, setClipboardAction] = useState(null);

  useEffect(() => {

    if (showShared) {
      fetchSharedFiles();
    } else if (showRecycle) {
      fetchRecycleItems();
    } else if (showRecent) {
      fetchRecentItems();
    } else {
      fetchFiles();
      fetchFolders();
    }

    // eslint-disable-next-line

  }, [currentFolder, showShared, showRecycle, showRecent]);

  // Compute a display name that preserves/infers extension
  const getDisplayName = (file) => {
    if (!file) return "";
    const name = file.fileName || file.name || file.originalFileName || "";
    const hasExt = /\.[^/.]+$/.test(name);
    if (hasExt) return name;

    // try originalFileName first, then fileUrl
    const src = file.originalFileName
      || (file.fileUrl
        ? decodeURIComponent(
            file.fileUrl.split("/").pop().split("?")[0]
          )
        : "");

    const extMatch = src && src.match(/\.[^/.]+$/);

    return name + (extMatch ? extMatch[0] : "");
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchFilter("");
  };

  const refreshAll = () => {
    if (showRecycle) {
      fetchRecycleItems();
    } else {
      fetchFiles();
      fetchFolders();
    }

    if (showShared) {
      fetchSharedFiles();
    }

    // clear selections so checkboxes are reset on refresh
    setSelectedFiles([]);
    setSelectedFolders([]);
    resetSearch();
  };

  const handleSearch = () => {
    setSearchFilter(searchQuery.trim());
  };

  const fetchRecentItems = async () => {
    try {
      const [filesRes, foldersRes] = await Promise.all([
        API.get("/files/recent"),
        API.get("/folders/recent")
      ]);

      setRecentFilesList(filesRes.data);
      setRecentFoldersList(foldersRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  const effectiveFolders = showShared
    ? []
    : showRecycle
    ? recycleFolders
    : showRecent
    ? recentFoldersList
    : folders;
  const effectiveFiles = showShared
    ? sharedFiles
    : showRecycle
    ? recycleFiles
    : showRecent
    ? recentFilesList
    : files;

  const filteredFolders = searchFilter
    ? effectiveFolders.filter((item) =>
        getDisplayName(item)
          .toLowerCase()
          .includes(searchFilter.toLowerCase())
      )
    : effectiveFolders;

  const filteredFiles = searchFilter
    ? effectiveFiles.filter((item) =>
        getDisplayName(item)
          .toLowerCase()
          .includes(searchFilter.toLowerCase())
      )
    : effectiveFiles;


  // =========================
  // FETCH FILES
  // =========================

  const fetchFiles = async () => {

    try {

      const res = await API.get("/files", {
        params: {
          folderId: currentFolder || null
        }
      });

      console.log("FILES RESPONSE:", res.data);

      setFiles(res.data);

    } catch (err) {

      console.log(err);
    }
  };



  // =========================
  // FETCH FOLDERS
  // =========================

  const fetchFolders = async () => {

    try {

      const res = await API.get("/folders", {
        params: {
          parentId: currentFolder || null
        }
      });

      console.log("FOLDERS RESPONSE:", res.data);

      setFolders(res.data);

    } catch (err) {

      console.log(err);
    }
  };



  // =========================
  // UPLOAD FILE
  // =========================

  const upload = async (e) => {

  try {

    const file = e.target.files[0];

    if (!file) return;

    // check duplicate
    const existingFile =
      files.find(

        (f) =>
          f.fileName === file.name
      );

    // ask replace
    if (existingFile) {

      const replace =
        window.confirm(

          "File already exists.\n\nReplace file?"
        );

      // cancel upload
      if (!replace) {

        document.getElementById(
          "fileUpload"
        ).value = "";

        return;
      }

      // replace existing
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      await API.put(

        `/files/replace/${existingFile._id}`,

        formData
      );

      fetchFiles();

      document.getElementById(
        "fileUpload"
      ).value = "";

      return;
    }

    // NORMAL UPLOAD

    setUploadFileName(
      file.name
    );

    setUploading(true);

    setProgress(0);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "folderId",
      currentFolder
    );

    await API.post(
      "/files/upload",
      formData,
      {

        onUploadProgress:
          (progressEvent) => {

            const percent =
              Math.round(

                (
                  progressEvent.loaded * 100
                ) /

                progressEvent.total
              );

            setProgress(percent);
          }
      }
    );

    fetchFiles();

    setTimeout(() => {

      setUploading(false);

      setProgress(0);

      document.getElementById(
        "fileUpload"
      ).value = "";

    }, 500);

  } catch (err) {

    console.log(err);

    setUploading(false);

    alert("Upload failed");
  }
};



  // =========================
  // CREATE FOLDER
  // =========================

  const createFolder = async () => {

    const name = prompt("Folder name");

    if (!name) return;

    await API.post("/folders", {
      name,
      parentId: currentFolder
    });

    fetchFolders();
  };



  // =========================
  // DELETE FILE
  // =========================

  const deleteFile = async (id) => {

    if (showRecycle) {
      await API.delete(`/files/permanent/${id}`);
      fetchRecycleItems();
    } else {
      await API.delete(`/files/${id}`);
      fetchFiles();
    }
  };



  // =========================
  // DELETE FOLDER
  // =========================

  const deleteFolder = async (id) => {

    if (showRecycle) {
      await API.delete(`/folders/permanent/${id}`);
      fetchRecycleItems();
    } else {
      await API.delete(`/folders/${id}`);
      fetchFolders();
    }
  };



  // =========================
  // RENAME FILE
  // =========================

  const renameFile = async (id) => {

    const name = prompt("New file name");

    if (!name) return;

    await API.put(`/files/${id}`, {
      name
    });

    fetchFiles();
  };



  // =========================
  // RENAME FOLDER
  // =========================

  const renameFolder = async (id) => {

    const name = prompt("New folder name");

    if (!name) return;

    await API.put(`/folders/${id}`, {
      name
    });

    fetchFolders();
  };



  // =========================
  // RIGHT CLICK MENU
  // =========================

  const handleRightClick = (e, item, type) => {

    e.preventDefault();

    setMenu({
      x: e.pageX,
      y: e.pageY,
      item,
      type
    });
  };



  // =========================
  // OPEN FOLDER
  // =========================

  const openFolder = (folder) => {

    setSelectedFiles([]);
    setSelectedFolders([]);
    resetSearch();
    setShowRecent(false);
    setShowShared(false);
    setShowRecycle(false);

    setFolderHistory([
      ...folderHistory,
      currentFolder
    ]);

    setCurrentFolder(folder._id);

    setCurrentFolderName(folder.name);
  };



  // =========================
  // GO BACK
  // =========================

  const goBack = () => {

    setSelectedFiles([]);
    setSelectedFolders([]);
    resetSearch();
    setShowRecent(false);

    const previous =
      folderHistory[folderHistory.length - 1];

    setFolderHistory(
      folderHistory.slice(0, -1)
    );

    setCurrentFolder(previous || null);

    if (!previous) {
      setCurrentFolderName("My Drive");
    }
  };



  // =========================
  // FILE ICONS
  // =========================

  const getFileIcon = (name) => {

    const ext =
      name.split(".").pop().toLowerCase();

    if (ext === "pdf")
      return <FaFilePdf color="#e53935" />;

    if (["doc", "docx"].includes(ext))
      return <FaFileWord color="#1565c0" />;

    if (["xls", "xlsx"].includes(ext))
      return <FaFileExcel color="#2e7d32" />;

    if (["ppt", "pptx"].includes(ext))
      return <FaFilePowerpoint color="#ef6c00" />;

    if (
      ["png", "jpg", "jpeg", "gif", "webp"]
        .includes(ext)
    )
      return <FaFileImage color="#8e24aa" />;

    if (
      ["mp4", "mov", "avi", "mkv"]
        .includes(ext)
    )
      return <FaFileVideo color="#c2185b" />;

    if (
      ["zip", "rar", "7z"]
        .includes(ext)
    )
      return <FaFileArchive color="#6d4c41" />;

    return <FaFileAlt />;
  };

  const shareFile = async (file) => {

  const email = prompt(
    "Enter user's email"
  );

  if (!email) return;

  try {

    await API.post(
      "/files/share",
      {
        fileId: file._id,
        email
      }
    );

    alert("File shared");

  } catch (err) {

    console.log(err);

    alert(
      err.response?.data ||
      "Share failed"
    );
  }
};

const fetchSharedFiles = async () => {

  try {

    const res = await API.get(
      "/files/shared/me"
    );

    setSharedFiles(res.data);

    console.log(
      "SHARED FILES:",
      res.data
    );

  } catch (err) {

    console.log(err);
  }
};

const fetchRecycleItems = async () => {
  try {
    const [filesRes, foldersRes] = await Promise.all([
      API.get("/files/recycle"),
      API.get("/folders/recycle")
    ]);

    setRecycleFiles(filesRes.data);
    setRecycleFolders(foldersRes.data);
  } catch (err) {
    console.log(err);
  }
};

const showDetails = (item) => {

  const isFolder =
    item.name !== undefined;

  const title =
    isFolder
      ? item.name
      : getDisplayName(item);

  const size =
    isFolder
      ? "Folder"
      : `${(
          item.fileSize / 1024
        ).toFixed(2)} KB`;

  const date =
    item.sharedAt
      ? new Date(
          item.sharedAt
        ).toLocaleString()
      : new Date(
          item.createdAt
        ).toLocaleString();

  const sender =
    item.senderName
      ? `\nSent By: ${item.senderName}`
      : "";

  alert(

`Name: ${title}

Size: ${size}

Date: ${date}${sender}`

  );
};

const toggleFileSelection = (id) => {

  if (selectedFiles.includes(id)) {

    setSelectedFiles(
      selectedFiles.filter(
        (f) => f !== id
      )
    );

  } else {

    setSelectedFiles([
      ...selectedFiles,
      id
    ]);
  }
};

const toggleFolderSelection = (id) => {

  if (selectedFolders.includes(id)) {

    setSelectedFolders(
      selectedFolders.filter(
        (f) => f !== id
      )
    );

  } else {

    setSelectedFolders([
      ...selectedFolders,
      id
    ]);
  }
};

const copySelected = () => {

  setClipboard({
    files: selectedFiles,
    folders: selectedFolders
  });

  setClipboardAction("copy");

  alert("Copied to clipboard");
};

const moveSelected = () => {

  setClipboard({
    files: selectedFiles,
    folders: selectedFolders
  });

  setClipboardAction("move");

  alert("Ready to move");
};

const deleteSelected = async () => {

  try {

    if (showRecycle) {
      if (selectedFiles.length > 0) {
        await API.post("/files/permanent", {
          ids: selectedFiles
        });
      }

      if (selectedFolders.length > 0) {
        await API.post("/folders/permanent", {
          ids: selectedFolders
        });
      }

      fetchRecycleItems();
    } else {
      // soft delete files
      for (const id of selectedFiles) {
        await API.delete(`/files/${id}`);
      }

      // soft delete folders
      for (const id of selectedFolders) {
        await API.delete(`/folders/${id}`);
      }

      fetchFiles();
      fetchFolders();
    }

    setSelectedFiles([]);
    setSelectedFolders([]);

  } catch (err) {

    console.log(err);
  }
};

const restoreSelected = async () => {
  try {
    if (selectedFiles.length > 0) {
      await API.post("/files/restore", {
        ids: selectedFiles
      });
    }

    if (selectedFolders.length > 0) {
      await API.post("/folders/restore", {
        ids: selectedFolders
      });
    }

    fetchRecycleItems();
    setSelectedFiles([]);
    setSelectedFolders([]);
  } catch (err) {
    console.log(err);
  }
};

const shareSelected = async () => {

  const email = prompt(
    "Enter email to share:"
  );

  if (!email) return;

  try {

    for (const id of selectedFiles) {

      await API.post(
        "/files/share",
        {
          fileId: id,
          email
        }
      );
    }

    alert("Files shared");

  } catch (err) {

    console.log(err);
  }
};

const copyItem = async (item) => {

  const targetFolder =
    prompt(
      "Enter destination folder ID"
    );

  if (!targetFolder) return;

  try {

    await API.post(
      "/files/copy",
      {
        fileId: item._id,
        targetFolder
      }
    );

    alert("Copied");

  } catch (err) {

    console.log(err);
  }
};

const moveItem = async (item) => {

  const targetFolder =
    prompt(
      "Enter destination folder ID"
    );

  if (!targetFolder) return;

  try {

    await API.put(
      `/files/move/${item._id}`,
      {
        folderId:
          targetFolder
      }
    );

    fetchFiles();

    alert("Moved");

  } catch (err) {

    console.log(err);
  }
};

const pasteItems = async () => {

  if (!clipboard) return;

  try {

    // COPY
    if (clipboardAction === "copy") {

      for (const id of clipboard.files) {

        await API.post(
          "/files/copy",
          {
            fileId: id,
            targetFolder:
              currentFolder
          }
        );
      }

      for (const id of clipboard.folders) {

        await API.post(
          "/folders/copy",
          {
            folderId: id,
            targetFolder:
              currentFolder
          }
        );
      }
    }

    // MOVE
    if (clipboardAction === "move") {

      for (const id of clipboard.files) {

        await API.put(
          `/files/move/${id}`,
          {
            folderId:
              currentFolder
          }
        );
      }

      for (const id of clipboard.folders) {

        await API.put(
          `/folders/move/${id}`,
          {
            parentId:
              currentFolder
          }
        );
      }

      setClipboard(null);

      setClipboardAction(null);

      setSelectedFiles([]);
      setSelectedFolders([]);
    }

    fetchFiles();
    fetchFolders();

    alert("Paste successful");

  } catch (err) {

    console.log(err);

    alert("Paste failed");
  }
};

const cancelPaste = () => {
  setClipboard(null);
  setClipboardAction(null);
  setSelectedFiles([]);
  setSelectedFolders([]);
};



  return (

    <div
      className="dashboard"
      onClick={() => setMenu(null)}
    >

      {/* SIDEBAR */}

      <div className="sidebar">

        <h2>My Drive</h2>
        <p
  style={{
    color: "#cfd8ff",
    marginTop: "-10px",
    marginBottom: "30px",
    fontSize: "14px",
    textAlign: "center"
  }}
>
  {localStorage.getItem("userName")}
</p>

        <button className="top-action-btn" onClick={createFolder}>
          + New Folder
        </button>

       <button
         className="top-action-btn"
         onClick={() => {

           resetSearch();
           fetchSharedFiles();
           setCurrentFolder(null);
           setShowRecent(false);
           setShowShared(true);
           setShowRecycle(false);
         }}
       >
         Shared With Me
       </button>

       <button
         className="top-action-btn"
         onClick={() => {
             resetSearch();
           setShowRecent(false);
           setShowRecycle(true);
           setShowShared(false);
         }}
       >
         Recycle Bin
       </button>

       <button
         className="top-action-btn"
         onClick={() => {
           resetSearch();
           setShowRecent(true);
           setShowShared(false);
           setShowRecycle(false);
           setCurrentFolder(null);
         }}
       >
         Recent
       </button>

        <button
          className="top-action-btn"
          onClick={() => {

            localStorage.removeItem("token");

            sessionStorage.removeItem("token");

            window.location.reload();
          }}
        >
          Logout
        </button>

      </div>



      {/* MAIN */}

      <div className="main">

      {/* HEADER */}

      {currentFolder && (

        <div className="folder-header">

          <button
            className="back-btn"
            onClick={goBack}
          >
            ←
          </button>

          <h3 className="folder-title">
            {currentFolderName}
          </h3>

          <button
            className="top-action-btn"
            onClick={refreshAll}
            style={{ marginLeft: 12 }}
          >
            ↻
          </button>

          <div className="search-block" style={{ marginLeft: 12 }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="top-action-btn" onClick={handleSearch}>
              Search
            </button>
          </div>

          {/* ACTION BAR - Next to folder title */}

          {
            (selectedFiles.length > 0 || selectedFolders.length > 0 || clipboard) && (

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginLeft: "30px",
                  alignItems: "center"
                }}
              >

                {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
                  <>
                    <button
                      className="action-btn delete-btn"
                      onClick={deleteSelected}
                    >
                      Delete
                    </button>

                    <button
                      className="action-btn share-btn"
                      onClick={shareSelected}
                    >
                      Share
                    </button>

                    <button
                      className="action-btn copy-btn"
                      onClick={copySelected}
                    >
                      Copy
                    </button>

                    <button
                      className="action-btn move-btn"
                      onClick={moveSelected}
                    >
                      Move
                    </button>
                  </>
                )}

                {clipboard && (
                  <>
                    <button
                      className="action-btn"
                      onClick={pasteItems}
                      style={{ padding: "12px 24px" }}
                    >
                      Paste
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={cancelPaste}
                      style={{ padding: "12px 24px" }}
                    >
                      Cancel
                    </button>
                  </>
                )}

              </div>
            )
          }

        </div>

      )}

      {/* ACTION BAR - Visible when items selected OR clipboard has items */}

      {
        !currentFolder && !showShared && (showRecycle ? (selectedFiles.length > 0 || selectedFolders.length > 0) : (selectedFiles.length > 0 || selectedFolders.length > 0 || clipboard)) && (

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginLeft: "20px",
              marginBottom: "20px",
              alignItems: "center"
            }}
          >

            {showRecycle ? (
              <>
                <button
                  className="action-btn delete-btn"
                  onClick={deleteSelected}
                >
                  Delete
                </button>

                <button
                  className="action-btn share-btn"
                  onClick={restoreSelected}
                >
                  Restore
                </button>
              </>
            ) : (
              <>
                {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
                  <>
                    <button
                      className="action-btn delete-btn"
                      onClick={deleteSelected}
                    >
                      Delete
                    </button>

                    <button
                      className="action-btn share-btn"
                      onClick={shareSelected}
                    >
                      Share
                    </button>

                    <button
                      className="action-btn copy-btn"
                      onClick={copySelected}
                    >
                      Copy
                    </button>

                    <button
                      className="action-btn move-btn"
                      onClick={moveSelected}
                    >
                      Move
                    </button>
                  </>
                )}

                {clipboard && (
                  <>
                    <button
                      className="action-btn"
                      onClick={pasteItems}
                      style={{ padding: "12px 24px" }}
                    >
                      Paste
                    </button>
                    <button
                      className="action-btn cancel-btn"
                      onClick={cancelPaste}
                      style={{ padding: "12px 24px" }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}

          </div>
        )
      }



        {/* FILE INPUT */}

        <input
          type="file"
          hidden
          id="fileUpload"
          onChange={upload}
        />



        {/* UPLOAD BUTTON */}

        <button
          className="upload-btn"
          onClick={() =>
            document
              .getElementById("fileUpload")
              .click()
          }
        >
          +
        </button>



        {/* GRID / LIST */}

      <div
  className={
    view === "grid"
      ? "grid"
      : "list"
  }

  onContextMenu={(e) => {

    if (
      e.target.className === "grid" ||

      e.target.className === "list"
    ) {

      e.preventDefault();

      setMenu({
        x: e.pageX,
        y: e.pageY,
        type: "empty"
      });
    }
  }}
>

          {/* FOLDERS */}

          {
  showShared ? (

    <>

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
          width: "100%"
        }}
      >

        <button
          className="back-btn"
          onClick={() =>
            setShowShared(false)
          }
        >
          ←
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: "28px"
          }}
        >
          Shared With Me
        </h1>

        <button
          className="top-action-btn"
          onClick={refreshAll}
          style={{ marginLeft: 12 }}
        >
          ↻
        </button>

        <div className="search-block" style={{ marginLeft: 12 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search files"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="top-action-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {
          (selectedFiles.length > 0 || selectedFolders.length > 0 || clipboard) && (

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginLeft: "30px",
                alignItems: "center"
              }}
            >

              {(selectedFiles.length > 0 || selectedFolders.length > 0) && (
                <>
                  <button
                    className="action-btn delete-btn"
                    onClick={deleteSelected}
                  >
                    Delete
                  </button>

                  <button
                    className="action-btn share-btn"
                    onClick={shareSelected}
                  >
                    Share
                  </button>

                  <button
                    className="action-btn copy-btn"
                    onClick={copySelected}
                  >
                    Copy
                  </button>

                  <button
                    className="action-btn move-btn"
                    onClick={moveSelected}
                  >
                    Move
                  </button>
                </>
              )}

              {clipboard && (
                <>
                  <button
                    className="action-btn"
                    onClick={pasteItems}
                    style={{ padding: "12px 24px" }}
                  >
                    Paste
                  </button>

                  <button
                    className="action-btn cancel-btn"
                    onClick={cancelPaste}
                    style={{ padding: "12px 24px" }}
                  >
                    Cancel
                  </button>
                </>
              )}

            </div>
          )
        }

      </div>



      {/* SHARED FILES */}

     {filteredFiles.map((f) => (

  <div
    key={f._id}

    className={
      view === "grid"
        ? "card"
        : "list-card"
    }

    style={{
      position: "relative"
    }}

    onDoubleClick={() =>
      setSelectedFile(f)
    }

    onContextMenu={(e) =>
      handleRightClick(
        e,
        f,
        "file"
      )
    }
  >

    <input
      type="checkbox"

      checked={selectedFiles.includes(f._id)}

      onChange={() =>
        toggleFileSelection(f._id)
      }

      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 18,
        height: 18,
        cursor: "pointer"
      }}
    />

    <span className="item-icon">
      {getFileIcon(getDisplayName(f))}
    </span>

    <span className="item-name">

      {getDisplayName(f).length > 25

        ? getDisplayName(f).substring(0, 25) + "..."

        : getDisplayName(f)}

    </span>

    <span
      style={{
        fontSize: "12px",
        color: "gray",
        marginTop: "8px"
      }}
    >
      {`Sent by ${f.senderName}`}
    </span>

  </div>

))}

      {/* NO SHARED FILES MESSAGE */}

      {sharedFiles.length === 0 && (

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            padding: "40px 20px",
            fontSize: "18px",
            color: "#999",
            textAlign: "center"
          }}
        >
          No files and Folders found
        </div>

      )}

    </>

  ) : (

    <>

      {/* FOLDERS */}

      {!showShared && !currentFolder && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
            width: "100%"
          }}
        >
          {(showRecycle || showRecent) && (
            <button
              className="top-action-btn"
              onClick={() => {
                resetSearch();
                setShowRecycle(false);
                setShowRecent(false);
                setShowShared(false);
                setCurrentFolder(null);
              }}
              style={{ marginRight: 8 }}
            >
              ←
            </button>
          )}

          <h1 style={{ margin: 0, fontSize: "24px" }}>
            {showRecycle ? "Recycle Bin" : showRecent ? "Recent" : currentFolderName}
          </h1>

          <button className="top-action-btn" onClick={refreshAll} style={{ marginLeft: 12 }}>
            ↻
          </button>

          <div className="search-block" style={{ marginLeft: 12 }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search files"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="top-action-btn" onClick={handleSearch}>
              Search
            </button>
          </div>

        </div>
      )}

{filteredFolders.map((f) => (

  <div
    key={f._id}

    className={
      view === "grid"
        ? "card"
        : "list-card"
    }

    style={{
      position: "relative"
    }}

    onDoubleClick={() =>
      openFolder(f)
    }

    onContextMenu={(e) =>
      handleRightClick(
        e,
        f,
        "folder"
      )
    }
  >

    {/* CHECKBOX */}

    <input
      type="checkbox"

      checked={selectedFolders.includes(f._id)}

      onChange={() =>
        toggleFolderSelection(f._id)
      }

      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 18,
        height: 18,
        cursor: "pointer"
      }}
    />

    {/* FOLDER ICON */}

    <span className="item-icon">
      📁
    </span>

    {/* FOLDER NAME */}

    <span className="item-name">
      {f.name}
    </span>

  </div>

))}

{/* NO FILES AND FOLDERS MESSAGE */}

{filteredFiles.length === 0 && filteredFolders.length === 0 && (

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      padding: "40px 20px",
      fontSize: "18px",
      color: "#999",
      textAlign: "center"
    }}
  >
    No files and Folders found
  </div>

)}

{/* EMPTY MENU */}

{menu &&menu.type === "empty" && clipboard && (

  <>

    <div
      onClick={() => {

        pasteItems();

        setMenu(null);
      }}
    >
      Paste
    </div>

    <div
      onClick={() => {

        cancelPaste();

        setMenu(null);
      }}
      className="menu-cancel"
    >
      Cancel
    </div>

  </>

)}

      {/* FILES */}

{filteredFiles.map((f) => (

  <div
    key={f._id}

    className={
      view === "grid"
        ? "card"
        : "list-card"
    }

    style={{
      position: "relative"
    }}

    onDoubleClick={() =>
      setSelectedFile(f)
    }

    onContextMenu={(e) =>
      handleRightClick(
        e,
        f,
        "file"
      )
    }
  >

    {/* CHECKBOX */}

    <input
      type="checkbox"

      checked={selectedFiles.includes(f._id)}

      onChange={() =>
        toggleFileSelection(f._id)
      }

      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 18,
        height: 18,
        cursor: "pointer"
      }}
    />

    {/* FILE ICON */}

    <span className="item-icon">
      {getFileIcon(getDisplayName(f))}
    </span>

    {/* FILE NAME */}

    <span className="item-name">

      {getDisplayName(f).length > 25

        ? getDisplayName(f).substring(0, 25) + "..."

        : getDisplayName(f)}

    </span>

  </div>

))}

    </>

  )
}
</div>



        {/* UPLOAD PROGRESS */}

        {uploading && (

          <div className="upload-progress-box">

            <div className="upload-file-name">
              Uploading {uploadFileName}
            </div>

            <div className="progress-container">

              <div
                className="progress-bar"
                style={{
                  width: `${progress}%`
                }}
              >
                {progress}%
              </div>

            </div>

          </div>

        )}



        {/* RIGHT CLICK MENU */}

        {menu && (

          <div
            className="menu"
            style={{
              top: menu.y,
              left: menu.x
            }}
          >

            {/* FILE MENU */}

            {menu &&menu.type === "file" && (

              <>

                <div
                  onClick={() =>
                    setSelectedFile(menu.item)
                  }
                >
                  Open
                </div>

                <div
                  onClick={() =>
                    deleteFile(menu.item._id)
                  }
                >
                  Delete
                </div>

                <div
                  onClick={() => 
                    shareFile(menu.item)}
                >
                  Share
                </div>

                <div
                  onClick={() =>
                    renameFile(menu.item._id)
                  }
                >
                  Rename
                </div>

                <div
  onClick={() =>
    copyItem(menu.item)
  }
>
  Copy
</div>

<div
  onClick={() =>
    moveItem(menu.item)
  }
>
  Move
</div>

                <div
  onClick={() => {

    showDetails(menu.item);

    setMenu(null);
  }}
>
  Details
</div>

              </>

            )}



            {/* FOLDER MENU */}

            {menu.type === "folder" && (

              <>

                <div
                  onClick={() =>
                    openFolder(menu.item)
                  }
                >
                  Open
                </div>

                <div
                  onClick={() =>
                    deleteFolder(menu.item._id)
                  }
                >
                  Delete
                </div>

                <div
                  onClick={() =>
                    renameFolder(menu.item._id)
                  }
                >
                  Rename
                </div>

                <div
  onClick={() =>
    copyItem(menu.item)
  }
>
  Copy
</div>

<div
  onClick={() =>
    moveItem(menu.item)
  }
>
  Move
</div>

                <div
  onClick={() => {

    alert(
`
Name: ${menu.item.name || getDisplayName(menu.item)}

Size: ${
menu.item.fileSize
? (menu.item.fileSize / 1024).toFixed(2) + " KB"
: "Folder"
}

Date:
${
  menu.item.sharedAt
    ? new Date(menu.item.sharedAt).toLocaleString()
    : menu.item.createdAt
    ? new Date(menu.item.createdAt).toLocaleString()
    : "-"
}

${
  showShared
    ? `Received:
${menu.item.sharedAt
      ? new Date(menu.item.sharedAt).toLocaleString()
      : "-"}
`
    : ""
}
`
    );

    setMenu(null);
  }}
>
  Details
</div>

              </>

            )}

          </div>

        )}



        {/* VIEW TOGGLE */}

        <div className="view-toggle-bottom">

          <button
            onClick={() => setView("grid")}
          >
            🔲
          </button>

          <button
            onClick={() => setView("list")}
          >
            📄
          </button>

        </div>



      {/* FILE VIEWER */}

{selectedFile && (

  <div className="file-viewer-overlay">

    <div className="file-viewer">

      {/* HEADER */}

      <div className="viewer-header">

        <h3>
          {getDisplayName(selectedFile)}
        </h3>

        <div className="viewer-actions">

          <a
  href={selectedFile.fileUrl}
  target="_blank"
  rel="noreferrer"
  download={getDisplayName(selectedFile)}
  className="download-btn"
>
  Download
</a>

          <button
            className="close-btn"
            onClick={() =>
              setSelectedFile(null)
            }
          >
            ✕
          </button>

        </div>

      </div>



      {/* FILE PREVIEW */}

      {getDisplayName(selectedFile).toLowerCase().endsWith(".pdf") ? (

  <iframe
    title="pdf-preview"
    width="100%"
    height="100%"
    style={{
      border: "none",
      borderRadius: "0 0 20px 20px"
    }}

    src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
      selectedFile.fileUrl
    )}`}
  />

) : getDisplayName(selectedFile).toLowerCase().endsWith(".docx") ||

  getDisplayName(selectedFile).toLowerCase().endsWith(".doc") ? (

        <iframe
          title="doc-preview"

          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.fileUrl)}`}

          width="100%"
          height="100%"

          style={{
            border: "none",
            borderRadius: "0 0 20px 20px"
          }}
        />

      ) : (

        <div className="no-preview">

          <p>
            Preview not available for this file type.
          </p>

          <p>
            Click Download to save the file.
          </p>

        </div>

      )}

    </div>

  </div>

)}

      </div>

    </div>

  );
}