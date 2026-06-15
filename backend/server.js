// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger for debugging routes
app.use((req, res, next) => {
	console.log("REQ", req.method, req.path);
	next();
});

require("./config/db")();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/files", require("./routes/file"));
app.use("/api/folders", require("./routes/folder"));

// Temporary healthcheck route for debugging
app.get('/__health', (req, res) => res.send('ok'));

app.listen(5000, () => console.log("Server running"));