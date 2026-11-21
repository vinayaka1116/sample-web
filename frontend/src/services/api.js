import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 180000,
  withCredentials: true,
});

export const authApi = {
  saveSession: (result) => {
    if (!result?.user) {
      throw new Error("Authentication response did not include an account.");
    }
    return result.user;
  },

  clearSession: () => {
    sessionStorage.removeItem("stockai_access_token");
    sessionStorage.removeItem("stockai_user");
    localStorage.removeItem("stockai_user");
  },

  me: async () => {
    const res = await api.get("/api/auth/me");
    return res.data?.user;
  },

  logout: async () => {
    const res = await api.post("/api/auth/logout");
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    return res.data;
  },

  register: async (name, email, password, ageConfirmed, termsAccepted) => {
    const res = await api.post("/api/auth/register", {
      name,
      email,
      password,
      age_confirmed: ageConfirmed,
      terms_accepted: termsAccepted,
    });
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post("/api/auth/forgot-password", { email });
    return res.data;
  },

  resetPassword: async (email, token, new_password) => {
    const res = await api.post("/api/auth/reset-password", {
      email,
      token,
      new_password,
    });
    return res.data;
  },
};

export const portfolioApi = {
  getPortfolio: async () => {
    const res = await api.get("/api/portfolio");
    return res.data?.portfolio || [];
  },

  addStock: async (item) => {
    const res = await api.post("/api/portfolio", item);
    return res.data;
  },

  removeStock: async (symbol) => {
    const res = await api.delete(`/api/portfolio/${encodeURIComponent(symbol)}`);
    return res.data;
  },

  createShare: async () => {
    const res = await api.post("/api/portfolio/share");
    return res.data?.share_token;
  },

  revokeShare: async () => {
    const res = await api.delete("/api/portfolio/share");
    return res.data;
  },

  getSharedPortfolio: async (token) => {
    const res = await api.post("/api/portfolio/shared", { token });
    return res.data?.portfolio || [];
  },
};

export const stocksApi = {
  getStock: (symbol) => api.get(`/api/stocks/${encodeURIComponent(symbol)}`),
  getTechnical: (symbol) => api.get(`/api/technical/${encodeURIComponent(symbol)}`),
  getRisk: (symbol) => api.get(`/api/risk/${encodeURIComponent(symbol)}`),
  getPredictionXGB: (symbol) => api.get(`/api/prediction/${encodeURIComponent(symbol)}`),
  getPredictionLSTM: (symbol) => api.get(`/api/prediction/${encodeURIComponent(symbol)}/lstm`, { timeout: 300000 }),
  searchStocks: (query) => api.get("/api/market-search", { params: { q: query } }),
};

export default api;
