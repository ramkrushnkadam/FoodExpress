import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../services/api";

const links = [
    ["Dashboard", "/admin/dashboard", "▦"],
    ["Orders", "/admin/orders", "◫"],
    ["Customers", "/admin/customers", "♙"],
    ["Food Management", "/admin/food", "🍔"],
    ["Restaurants", "/admin/restaurants", "⌂"],
    ["Reports", "/admin/reports", "▥"],
    ["Settings", "/admin/settings", "⚙"]
];

export default function AdminLayout() {
    const [user, setUser] = useState(null);
    const [menu, setMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        adminApi("/profile")
            .then(({ user }) => setUser(user))
            .catch(() => {
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                localStorage.removeItem(ADMIN_USER_KEY);
                setUser(false);
            });
    }, []);

    if (user === null) {
        return <div className="min-h-screen grid place-items-center text-slate-600">Loading secure admin area...</div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    const logout = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        navigate("/admin/login");
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMenu(!menu)}
                aria-label="Toggle admin navigation menu"
                aria-expanded={menu}
                className="fixed left-3 top-3 z-30 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-white shadow-md lg:hidden cursor-pointer"
            >
                ☰
            </button>

            {/* Mobile Backdrop Overlay */}
            {menu && (
                <button
                    aria-label="Close menu"
                    onClick={() => setMenu(false)}
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
                />
            )}

            {/* Admin Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-300 lg:translate-x-0 ${
                    menu ? "translate-x-0 shadow-2xl" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between border-b border-slate-700 px-5 py-5">
                    <Link
                        to="/admin/dashboard"
                        onClick={() => setMenu(false)}
                        className="text-lg font-bold text-white whitespace-nowrap"
                    >
                        🍔 FoodExpress <span className="text-amber-400">Admin</span>
                    </Link>
                    <button
                        onClick={() => setMenu(false)}
                        aria-label="Close menu"
                        className="lg:hidden text-slate-400 hover:text-white p-2 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer text-lg"
                    >
                        ✕
                    </button>
                </div>

                <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
                    {links.map(([name, to, icon]) => (
                        <NavLink
                            onClick={() => setMenu(false)}
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium min-h-[44px] transition ${
                                    isActive ? "bg-amber-400 text-slate-900 font-bold" : "hover:bg-slate-800"
                                }`
                            }
                        >
                            <span className="text-base">{icon}</span>
                            <span>{name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-slate-700 p-4">
                    <p className="truncate font-medium text-white">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                    <button
                        onClick={logout}
                        className="mt-3 w-full rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 transition min-h-[40px] flex items-center justify-center cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="min-h-screen lg:ml-64 flex flex-col justify-between">
                <div>
                    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6 pl-16 lg:pl-8 shadow-xs">
                        <div>
                            <p className="text-xs text-slate-500">FoodExpress</p>
                            <h1 className="font-semibold text-sm sm:text-base">Administration</h1>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs sm:text-sm font-medium text-amber-800">
                            Admin
                        </span>
                    </header>

                    <div className="p-4 sm:p-6 md:p-8">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
