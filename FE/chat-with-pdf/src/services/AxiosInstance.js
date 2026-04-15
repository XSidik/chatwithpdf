import axios from "axios";
import Cookies from "js-cookie";
import { ApiUrl } from "@/utils/env";

const AxiosInstance = axios.create({
  baseURL: ApiUrl,
  timeout: 10000,
});

// Request interceptor to add the bearer token
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log(`[Axios] 401 Unauthorized for ${originalRequest.url}. Attempting token refresh...`);

      if (isRefreshing) {
        console.log(`[Axios] Already refreshing, queuing request ${originalRequest.url}`);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return AxiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${ApiUrl}/account/refreshToken`, {
          refreshToken: refreshToken,
        });

        if (res.data.success) {
          console.log("[Axios] Token refresh successful.");
          const { token, refreshToken: newRefreshToken } = res.data.data;
          Cookies.remove("token");
          Cookies.remove("refreshToken");

          Cookies.set("token", token, { expires: 30, path: "/" });
          Cookies.set("refreshToken", newRefreshToken, { expires: 30, path: "/" });

          isRefreshing = false;
          processQueue(null, token);

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return AxiosInstance(originalRequest);
        } else {
          console.error("[Axios] Refresh token invalid or expired (logic check).");
          handleLogout();
          return Promise.reject(error);
        }
      } catch (err) {
        console.error("[Axios] Refresh token request failed:", err.message);
        isRefreshing = false;
        processQueue(err, null);
        handleLogout();
        return Promise.reject(err);
      }
    }

    // Handle other errors
    if (error.response?.status === 403 || error.response?.status === 401) {
       handleLogout();
    }

    return Promise.reject(error);
  }
);

const handleLogout = () => {
  Cookies.remove("token");
  Cookies.remove("refreshToken");
  if (typeof window !== "undefined" && window.location.pathname !== "/login" && window.location.pathname !== "/") {
    window.location.replace("/login");
  }
};

export default AxiosInstance;
