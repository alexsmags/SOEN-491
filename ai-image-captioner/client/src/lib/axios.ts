import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:5000",
  withCredentials: true, // allows sending cookies for Auth.js session
});
