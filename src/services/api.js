export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export const CUSTOMER_TOKEN_KEY = "foodexpress_token";
export const CUSTOMER_USER_KEY = "foodexpress_user";
export const ADMIN_TOKEN_KEY = "foodexpress_admin_token";
export const ADMIN_USER_KEY = "foodexpress_admin_user";

export async function apiRequest(path, options = {}, tokenKey = CUSTOMER_TOKEN_KEY) {
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
}
