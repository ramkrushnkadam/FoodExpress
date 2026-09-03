import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import { API_URL, CUSTOMER_TOKEN_KEY, CUSTOMER_USER_KEY, apiRequest } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem(CUSTOMER_USER_KEY);
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem(CUSTOMER_TOKEN_KEY) || null;
    });

    // Refresh profile from backend if token exists
    useEffect(() => {
        if (token) {
            fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (data?.user) {
                        setUser(data.user);
                        localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.user));
                    }
                })
                .catch(() => {});
        }
    }, [token]);

    // ==========================================
    // REGISTER
    // ==========================================

    const register = async (data) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    mobile: data.mobile || "",
                    address: data.address || ""
                })
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || "Registration failed"
                };
            }

            if (result.token && result.user) {
                localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
                localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(result.user));
                setToken(result.token);
                setUser(result.user);
            }

            return {
                success: true,
                message: result.message || "Registration successful",
                user: result.user
            };
        } catch (error) {
            console.error("Register error:", error);
            return {
                success: false,
                message: "Unable to connect to server"
            };
        }
    };

    // ==========================================
    // LOGIN
    // ==========================================

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || "Invalid email or password"
                };
            }

            localStorage.setItem(CUSTOMER_TOKEN_KEY, result.token);
            localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(result.user));

            setToken(result.token);
            setUser(result.user);

            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                message: "Unable to connect to server"
            };
        }
    };

    // ==========================================
    // LOGOUT (Customer only)
    // ==========================================

    const logout = () => {
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        localStorage.removeItem(CUSTOMER_USER_KEY);
        setToken(null);
        setUser(null);
    };

    // ==========================================
    // UPDATE PROFILE
    // ==========================================

    const updateProfile = async (profileData) => {
        try {
            const data = await apiRequest("/auth/profile", {
                method: "PUT",
                body: JSON.stringify(profileData)
            });

            if (data.user) {
                setUser(data.user);
                localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.user));
            }
            return { success: true, user: data.user, message: data.message };
        } catch (error) {
            return { success: false, message: error.message || "Failed to update profile" };
        }
    };

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================

    const forgotPassword = async (email) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email ? email.trim().toLowerCase() : "" })
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || "Failed to process forgot password request"
                };
            }

            return {
                success: true,
                message: result.message || "Password reset link sent",
                resetUrl: result.resetUrl
            };
        } catch (error) {
            console.error("Forgot password error:", error);
            return {
                success: false,
                message: "Unable to connect to server"
            };
        }
    };

    // ==========================================
    // RESET PASSWORD
    // ==========================================

    const resetPassword = async (token, password, confirmPassword) => {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, confirmPassword })
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || "Failed to reset password"
                };
            }

            return {
                success: true,
                message: result.message || "Password reset successfully"
            };
        } catch (error) {
            console.error("Reset password error:", error);
            return {
                success: false,
                message: "Unable to connect to server"
            };
        }
    };

    // ==========================================
    // AUTHENTICATED API REQUEST HELPER
    // ==========================================

    const authFetch = async (url, options = {}) => {
        const currentToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
        const headers = {
            ...(options.headers || {}),
            "Content-Type": "application/json",
            ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        };

        return fetch(url, {
            ...options,
            headers
        });
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                register,
                login,
                logout,
                updateProfile,
                forgotPassword,
                resetPassword,
                authFetch
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
