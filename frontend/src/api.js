import axios from "axios";

export const API = axios.create({
  baseURL: "https://cloud-drive-me.duckdns.org/api",
});

API.interceptors.request.use((req) => {

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});