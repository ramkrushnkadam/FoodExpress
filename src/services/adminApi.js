import { ADMIN_TOKEN_KEY, API_URL } from "./api";

export async function adminApi(path, options = {}) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const response = await fetch(`${API_URL}/admin${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
}

export const ADMIN_API_URL = `${API_URL}/admin`;
