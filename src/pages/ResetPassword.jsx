import { useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ResetPassword() {
    const { token: paramToken } = useParams();
    const [searchParams] = useSearchParams();
    const token = paramToken || searchParams.get("token") || "";

    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Live validation checks
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
    const isMatch = password && confirmPassword && password === confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!token) {
            setError("Password reset token is missing. Please request a new link.");
            return;
        }

        if (!password) {
            setError("Please enter a new password.");
            return;
        }

        if (!isPasswordValid) {
            setError(
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(token, password, confirmPassword);

            if (!result.success) {
                setError(result.message || "Failed to reset password. The link may be expired or invalid.");
                return;
            }

            setSuccess("Password has been reset successfully! You can now login with your new password.");
            setPassword("");
            setConfirmPassword("");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            console.error("Reset error:", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
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
                        Set a new password for your account
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                        Reset Password
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
                            <p className="font-semibold">{success}</p>
                            <p className="mt-2 text-xs">Redirecting to login in 3 seconds...</p>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="mt-3 inline-block font-bold text-orange-500 underline"
                            >
                                Login Now
                            </button>
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            {/* Password Requirements Checklist */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs space-y-1 text-gray-600 dark:text-gray-300">
                                <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Password must contain:
                                </p>
                                <div className={hasMinLength ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {hasMinLength ? "✓" : "○"} At least 8 characters
                                </div>
                                <div className={hasUpper ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {hasUpper ? "✓" : "○"} At least one uppercase letter (A-Z)
                                </div>
                                <div className={hasLower ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {hasLower ? "✓" : "○"} At least one lowercase letter (a-z)
                                </div>
                                <div className={hasNumber ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {hasNumber ? "✓" : "○"} At least one number (0-9)
                                </div>
                                <div className={hasSpecial ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                                    {hasSpecial ? "✓" : "○"} At least one special character (!@#$%^&*)
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                {confirmPassword && (
                                    <p className={`mt-1.5 text-xs ${isMatch ? "text-green-600 dark:text-green-400 font-medium" : "text-red-500"}`}>
                                        {isMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-bold transition text-white ${
                                    loading
                                        ? "bg-orange-300 cursor-not-allowed"
                                        : "bg-orange-500 hover:bg-orange-600"
                                }`}
                            >
                                {loading ? "Resetting Password..." : "Reset Password"}
                            </button>
                        </form>
                    )}

                    {/* Back to Login */}
                    <div className="text-center mt-6">
                        <Link
                            to="/login"
                            className="text-sm font-semibold text-orange-500 hover:text-orange-600"
                        >
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
