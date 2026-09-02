import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const { user, logout, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        address: "",
        password: ""
    });
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                mobile: user.mobile || "",
                address: user.address || "",
                password: ""
            });
        }
    }, [user, isEditing]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg({ type: "", text: "" });

        const payload = {
            name: formData.name,
            mobile: formData.mobile,
            address: formData.address
        };
        if (formData.password) {
            payload.password = formData.password;
        }

        const res = await updateProfile(payload);
        setSaving(false);

        if (res.success) {
            setStatusMsg({ type: "success", text: "Profile updated successfully!" });
            setIsEditing(false);
        } else {
            setStatusMsg({ type: "error", text: res.message || "Failed to update profile." });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-grow">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                        My Profile 👤
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Manage your FoodExpress account and preferences
                    </p>
                </div>

                {statusMsg.text && (
                    <div
                        className={`mb-6 p-4 rounded-xl text-sm font-medium ${
                            statusMsg.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                        {statusMsg.text}
                    </div>
                )}

                {user ? (
                    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 sm:px-8 py-8 text-white">
                            <div className="flex flex-col sm:flex-row items-center gap-5">
                                <div className="w-24 h-24 rounded-full bg-white text-orange-500 flex items-center justify-center text-4xl font-bold shadow-lg">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>

                                <div className="text-center sm:text-left flex-grow">
                                    <h2 className="text-2xl font-bold">{user.name || "FoodExpress User"}</h2>
                                    <p className="text-orange-100 mt-1">{user.email}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        {user.role || "Customer"}
                                    </span>
                                </div>

                                <div>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-5 py-2.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition shadow"
                                        >
                                            ✏️ Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Profile Information / Edit Form */}
                        <div className="p-6 sm:p-8">
                            {isEditing ? (
                                <form onSubmit={handleSave} className="space-y-5">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                                        Update Personal Information
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address (Cannot be changed)
                                        </label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mobile Number (10 digits)
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                            placeholder="e.g. 9876543210"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Delivery Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Enter your default delivery address"
                                            rows="3"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            New Password (Leave blank to keep current password)
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Min 6 characters"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-5">
                                        Account Details
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</p>
                                                <p className="font-semibold text-gray-800 mt-0.5">{user.name || "Not specified"}</p>
                                            </div>
                                        </div>

                                        <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
                                                <p className="font-semibold text-gray-800 mt-0.5">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number</p>
                                                <p className="font-semibold text-gray-800 mt-0.5">{user.mobile || "Not specified"}</p>
                                            </div>
                                        </div>

                                        <div className="border rounded-xl p-4 bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Delivery Address</p>
                                                <p className="font-semibold text-gray-800 mt-0.5">{user.address || "Not specified"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <h3 className="text-xl font-bold text-gray-800 mt-8 mb-5">Quick Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Link
                                            to="/orders"
                                            className="border border-gray-200 rounded-xl p-4 hover:border-orange-500 hover:bg-orange-50 transition"
                                        >
                                            <p className="font-bold text-gray-800">📦 My Orders</p>
                                            <p className="text-sm text-gray-500 mt-1">Track active orders & view order history</p>
                                        </Link>

                                        <Link
                                            to="/cart"
                                            className="border border-gray-200 rounded-xl p-4 hover:border-orange-500 hover:bg-orange-50 transition"
                                        >
                                            <p className="font-bold text-gray-800">🛒 My Cart</p>
                                            <p className="text-sm text-gray-500 mt-1">Review items currently in your cart</p>
                                        </Link>
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full mt-8 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition shadow-sm"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Not Logged In */
                    <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 text-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-5xl">
                            👤
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mt-6">
                            You are not logged in
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Login or create an account to manage your profile and view your orders.
                        </p>

                        <Link
                            to="/login"
                            className="inline-block mt-6 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition"
                        >
                            🔐 Login / Register
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Profile;
