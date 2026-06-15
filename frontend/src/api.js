import axios from "axios";

export const API = axios.create({
  baseURL: "http://13.48.30.209:5000/api",
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