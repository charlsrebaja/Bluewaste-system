import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "bluewaste_token";
const USER_KEY = "bluewaste_user";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

let cachedToken: string | null | undefined;

async function getToken() {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

export async function hydrateStoredSession() {
  const [token, userStr] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    SecureStore.getItemAsync(USER_KEY),
  ]);

  cachedToken = token;

  return { token, userStr };
}

export async function persistSession(token: string, user: unknown) {
  cachedToken = token;

  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearStoredSession() {
  cachedToken = null;

  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearStoredSession();
    }
    return Promise.reject(error);
  },
);

export default api;
