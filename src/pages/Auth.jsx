import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Auth() {
    const { register, login, forgotPassword } = useAuth();
    const navigate = useNavigate();

    // Mode: "login" | "register" | "forgot"
    const [mode, setMode] = useState("login");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [devResetUrl, setDevResetUrl] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobile: "",
        address: ""
    });

    // Helper validation functions
    const isValidGmail = (email) => {
        if (!email || typeof email !== "string") return false;
        const trimmed = email.trim().toLowerCase();
        const gmailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@gmail\.com$/;
        return gmailRegex.test(trimmed);
    };

    const isValidMobile = (mobile) => {
        if (!mobile) return false;
        const cleaned = String(mobile).trim();
        return /^[6-9]\d{9}$/.test(cleaned);
    };

    const isValidPassword = (password) => {
        if (!password || typeof password !== "string") return false;
        if (password.length < 8) return false;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        return hasUpper && hasLower && hasNumber && hasSpecial;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
        setError("");
        setSuccess("");
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!isValidGmail(form.email)) {
            setError("Please enter a valid Gmail address.");
            return;
        }

        if (!form.password) {
            setError("Please enter your password.");
            return;
        }

        setLoading(true);

        try {
            const result = await login(form.email.trim(), form.password);

            if (result.success) {
                navigate("/profile");
            } else {
                setError(result.message || "Invalid email or password.");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!form.email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!isValidGmail(form.email)) {
            setError("Please enter a valid Gmail address.");
            return;
        }

        if (!form.mobile.trim()) {
            setError("Please enter your mobile number.");
            return;
        }

        if (!isValidMobile(form.mobile)) {
            setError("Mobile number must be exactly 10 digits.");
            return;
        }

        if (!form.password) {
            setError("Please enter your password.");
            return;
        }

        if (!isValidPassword(form.password)) {
            setError(
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            );
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await register({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password,
                confirmPassword: form.confirmPassword,
                mobile: form.mobile.trim(),
                address: form.address.trim()
            });

            if (!result.success) {
                setError(result.message || "Registration failed. Please try again.");
                return;
            }

            setSuccess("Registration successful! Please login with your Gmail and password.");
            setForm({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
                mobile: "",
                address: ""
            });
            setMode("login");
        } catch (err) {
            console.error("Register Error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setDevResetUrl("");

        if (!form.email.trim()) {
            setError("Please enter your registered Gmail address.");
            return;
        }

        if (!isValidGmail(form.email)) {
            setError("Please enter a valid Gmail address.");
            return;
        }

        setLoading(true);

        try {
            const result = await forgotPassword(form.email.trim());

            if (!result.success) {
                setError(result.message || "No account found with this Gmail address.");
                return;
            }

            setSuccess("Password reset link has been sent to your Gmail address.");
            if (result.resetUrl) {
                setDevResetUrl(result.resetUrl);
            }
        } catch (err) {
            console.error("Forgot Password Error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError("");
        setSuccess("");
        setDevResetUrl("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-3xl font-bold text-orange-500"
                    >
                        🍔 FoodExpress
                    </button>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {mode === "login" && "Welcome back! Login to your account"}
                        {mode === "register" && "Create your FoodExpress account"}
                        {mode === "forgot" && "Reset your FoodExpress password"}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                        {mode === "login" && "Login"}
                        {mode === "register" && "Create Account"}
                        {mode === "forgot" && "Forgot Password"}
                    </h1>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-5 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Banner */}
                    {success && (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-5 text-sm">
                            <p>{success}</p>
                            {devResetUrl && (
                                <div className="mt-3 p-2 bg-white dark:bg-gray-900 rounded border border-green-300 text-xs">
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">
                                        Reset Link (Click to open):
                                    </p>
                                    <a
                                        href={devResetUrl}
                                        className="text-orange-500 hover:underline break-all font-mono"
                                    >
                                        {devResetUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ==========================================
                        1. LOGIN FORM
                    ========================================== */}
                    {mode === "login" && (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Gmail Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="example@gmail.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => switchMode("forgot")}
                                        className="text-xs font-semibold text-orange-500 hover:text-orange-600"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-bold transition text-white ${
                                    loading
                                        ? "bg-orange-300 cursor-not-allowed"
                                        : "bg-orange-500 hover:bg-orange-600"
                                }`}
                            >
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        </form>
                    )}

                    {/* ==========================================
                        2. REGISTER FORM
                    ========================================== */}
                    {mode === "register" && (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Gmail Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="example@gmail.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    placeholder="10-digit mobile number"
                                    value={form.mobile}
                                    onChange={handleChange}
                                    maxLength="10"
                                    inputMode="numeric"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Min 8 chars with upper, lower, digit & special"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Re-enter your password"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        autoComplete="new-password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {/* Address (Optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Address (Optional)
                                </label>
                                <textarea
                                    name="address"
                                    placeholder="Enter your delivery address"
                                    value={form.address}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-bold transition text-white ${
                                    loading
                                        ? "bg-orange-300 cursor-not-allowed"
                                        : "bg-orange-500 hover:bg-orange-600"
                                }`}
                            >
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    {/* ==========================================
                        3. FORGOT PASSWORD FORM
                    ========================================== */}
                    {mode === "forgot" && (
                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Enter your registered Gmail address. We will send you a secure link to reset your password.
                            </p>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Registered Gmail Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="example@gmail.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-bold transition text-white ${
                                    loading
                                        ? "bg-orange-300 cursor-not-allowed"
                                        : "bg-orange-500 hover:bg-orange-600"
                                }`}
                            >
                                {loading ? "Sending Reset Link..." : "Send Reset Link"}
                            </button>

                            <button
                                type="button"
                                onClick={() => switchMode("login")}
                                className="w-full text-center text-sm font-semibold text-orange-500 hover:text-orange-600 pt-2"
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}

                    {/* Footer switch for login/register */}
                    {mode !== "forgot" && (
                        <div className="text-center mt-6">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {mode === "login"
                                    ? "Don't have an account?"
                                    : "Already have an account?"}
                            </span>
                            <button
                                type="button"
                                onClick={() => switchMode(mode === "login" ? "register" : "login")}
                                className="ml-2 text-orange-500 font-semibold hover:text-orange-600"
                            >
                                {mode === "login" ? "Sign Up" : "Login"}
                            </button>
                        </div>
                    )}

                    {/* Back to Home */}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="w-full mt-5 text-gray-500 dark:text-gray-400 hover:text-orange-500 text-sm text-center"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Auth;
