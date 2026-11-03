import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("svhs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function request(promise) {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message || "Unable to connect to the school server";
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    throw apiError;
  }
}

export default api;
