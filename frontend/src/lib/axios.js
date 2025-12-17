import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chat-app-pnaz.onrender.com/api" : "https://chat-app-pnaz.onrender.com/api",
  withCredentials: true,
});
