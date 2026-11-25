import axios from "axios";
import qs from "qs";
import { expireSession } from "../utils/session.js";

// Single shared axios instance
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_APP_NAME}`,
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: "repeat",
    }),
});

// Attach the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 on an authenticated request means the login is no longer valid.
    // (Sign-in/sign-up also return 401 for wrong credentials - those aren't expiry.)
    const isAuthForm = /user\/sign(In|Up)/.test(error.config?.url || "");
    if (error.response?.status === 401 && !isAuthForm && error.config?.headers?.Authorization) {
      expireSession();
    }

    return Promise.reject({
      message: error.response?.data?.message || "Something went wrong!",
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config,
    });
  }
);

// Main service function returning API methods
const CustomApiService = () => {
  const GET = async (endpoint, params = {}, headers = {}) => {
    const res = await apiClient.get(`/${endpoint}`, { params, headers });
    return { ...res.data, headers: res.headers };
  };

  const POST = async (endpoint, params = {}, headers = {}, data) => {
    const res = await apiClient.post(`/${endpoint}`, data, { params, headers });
    return { ...res.data, headers: res.headers };
  };

  const PATCH = async (endpoint, params = {}, headers = {}, data, id) => {
    const res = await apiClient.patch(`/${endpoint}/${id}`, data, { params, headers });
    return { ...res.data, headers: res.headers };
  };

  const DELETE = async (endpoint, params = {}, headers = {}, id) => {
    const res = await apiClient.delete(`/${endpoint}/${id}`, { params, headers });
    return { ...res.data, headers: res.headers };
  };

  return { GET, POST, PATCH, DELETE };
};

export default CustomApiService;
