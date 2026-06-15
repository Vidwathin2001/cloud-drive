# Cloud Drive - Google Drive Clone

A full-stack cloud-based online file storage system built using React.js, Node.js, MongoDB, and AWS S3.

## Features

- User Authentication (JWT)
- File Upload & Download
- Folder Management
- File Sharing
- Shared With Me
- Search Files & Folders
- Recent Files
- Recycle Bin
- Multi Select
- Copy / Move / Paste
- File Preview
- AWS S3 Storage
- MongoDB Atlas Database

---

# Tech Stack

## Frontend
- React.js
- Axios
- CSS

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

## Cloud Services
- AWS S3
- MongoDB Atlas

---

# Project Structure

```bash
cloud-drive/
│
├── frontend/
├── backend/
└── README.md
```

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/cloud-drive.git
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file inside backend:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_KEY=your_aws_access_key
AWS_SECRET=your_aws_secret_key
BUCKET=your_bucket_name
```

Run backend:

```bash
node server.js
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

# Deployment

## Frontend
AWS Amplify

## Backend
AWS EC2

## Database
MongoDB Atlas

## Storage
AWS S3

---

# Screenshots

(Add screenshots here)

---

# Author

Vidwath Kumar