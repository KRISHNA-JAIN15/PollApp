import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  verifyEmail: (verificationData) => api.post("/auth/verify", verificationData),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }),
  logout: () => api.post("/auth/logout"),
  refreshToken: () => api.post("/auth/refresh"),
};

export const pollAPI = {
  getAllPolls: () => api.get("/polls"),
  getPoll: (id) => api.get(`/polls/${id}`),
  createPoll: (pollData) => api.post("/polls", pollData),
  votePoll: (id, optionId) => api.post(`/polls/${id}/vote`, { optionId }),
  getPollResults: (id) => api.get(`/polls/${id}/results`),
  getUserPolls: () => api.get("/polls/user/my-polls"),
  getUserVotes: () => api.get("/polls/user/my-votes"),
  deletePoll: (id) => api.delete(`/polls/${id}`),
};

export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  getStats: () => api.get("/users/stats"),
  getAllUsers: () => api.get("/users"),
};

export default api;
