import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest) {
      return Promise.reject(err);
    }

    const status = err?.response?.status;
    const publicEndpoints = ["/auth/authenticate", "/auth/register", "/auth/refresh"];
    const isPublicEndpoint = publicEndpoints.some(endpoint => originalRequest.url.includes(endpoint));

    if (status === 401 && !isPublicEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      if (originalRequest._retry) {
        return Promise.reject(err);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        apiClient.post("/auth/refresh", {}, { withCredentials: true })
          .then(response => {
            const { accessToken } = response.data;
            if (accessToken) {
              localStorage.setItem("accessToken", accessToken);
              apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
              processQueue(null, accessToken);
              resolve(apiClient(originalRequest));
            } else {
              const error = new Error("New access token not provided");
              processQueue(error, null);
              reject(error);
            }
          })
          .catch((e) => {
            processQueue(e, null);
            try {
              window.dispatchEvent(new Event("auth-error"));
            } catch (eventError) {
              console.error("Failed to dispatch auth-error event", eventError);
            }
            reject(e);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(err);
  }
);

export default apiClient;
