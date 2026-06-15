// src/App.js

import { useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import "./styles.css";

function App() {

  const [page, setPage] = useState("login");

  // ✅ Check both localStorage and sessionStorage
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  // ✅ If token exists → open dashboard
  if (token) {
    return <Dashboard />;
  }

  // ✅ Else show login/register
  return page === "login"
    ? (
        <Login
          goRegister={() => setPage("register")}
        />
      )
    : (
        <Register
          goLogin={() => setPage("login")}
        />
      );
}

export default App;