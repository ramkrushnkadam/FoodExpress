import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { adminApi } from "../services/adminApi";
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from "../services/api";

const links = [["Dashboard", "/admin/dashboard", "▦"], ["Orders", "/admin/orders", "◫"], ["Customers", "/admin/customers", "♙"], ["Food Management", "/admin/food", "🍔"], ["Restaurants", "/admin/restaurants", "⌂"], ["Reports", "/admin/reports", "▥"], ["Settings", "/admin/settings", "⚙"]];

export default function AdminLayout() {
    const [user, setUser] = useState(null), [menu, setMenu] = useState(false), navigate = useNavigate();
    useEffect(() => { adminApi("/profile").then(({ user }) => setUser(user)).catch(() => { localStorage.removeItem(ADMIN_TOKEN_KEY); localStorage.removeItem(ADMIN_USER_KEY); setUser(false); }); }, []);
    if (user === null) return <div className="min-h-screen grid place-items-center text-slate-600">Loading secure admin area...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    const logout = () => { localStorage.removeItem(ADMIN_TOKEN_KEY); localStorage.removeItem(ADMIN_USER_KEY); navigate("/admin/login"); };
    return <div className="min-h-screen bg-slate-100 text-slate-800">
        <button onClick={() => setMenu(!menu)} className="fixed left-4 top-4 z-30 rounded-lg bg-slate-900 px-3 py-2 text-white lg:hidden">☰</button>
        {menu && <button aria-label="Close menu" onClick={() => setMenu(false)} className="fixed inset-0 z-10 bg-black/40 lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
            <Link to="/admin/dashboard" className="border-b border-slate-700 px-6 py-6 text-xl font-bold text-white">🍔 FoodExpress <span className="text-amber-400">Admin</span></Link>
            <nav className="flex-1 space-y-1 p-3">{links.map(([name, to, icon]) => <NavLink onClick={() => setMenu(false)} key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${isActive ? "bg-amber-400 text-slate-900" : "hover:bg-slate-800"}`}><span>{icon}</span>{name}</NavLink>)}</nav>
            <div className="border-t border-slate-700 p-4"><p className="truncate font-medium text-white">{user.name}</p><p className="truncate text-xs text-slate-400">{user.email}</p><button onClick={logout} className="mt-3 w-full rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800">Logout</button></div>
        </aside>
        <main className="min-h-screen lg:ml-64"><header className="flex h-16 items-center justify-between border-b bg-white px-6 pl-16 shadow-sm lg:pl-8"><div><p className="text-xs text-slate-500">FoodExpress</p><h1 className="font-semibold">Administration</h1></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">Admin</span></header><div className="p-4 md:p-8"><Outlet /></div></main>
    </div>;
}
