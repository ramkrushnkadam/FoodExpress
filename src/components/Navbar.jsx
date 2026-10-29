import { Link, NavLink } from "react-router-dom";
import { useState } from "react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";


function Navbar() {

    const { cart, cartCount } = useCart();
    const displayCount = cartCount !== undefined ? cartCount : cart.length;

    const { user } = useAuth();

    const { darkMode, toggleTheme } = useTheme();

    const [menuOpen, setMenuOpen] = useState(false);


    const navClass = ({ isActive }) =>
        isActive
            ? "text-orange-500 font-bold"
            : "text-gray-700 dark:text-gray-200 hover:text-orange-500 transition";

    const mobileNavClass = ({ isActive }) =>
        isActive
            ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold min-h-[44px]"
            : "flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium min-h-[44px] transition";


    const closeMenu = () => {
        setMenuOpen(false);
    };


    return (

        <nav
            className="
            bg-white
            dark:bg-gray-900
            shadow-md
            sticky
            top-0
            z-50
            transition-colors
            duration-300
            "
        >

            <div
                className="
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-4
                flex
                justify-between
                items-center
                "
            >

                {/* Logo */}

                <Link
                    to="/"
                    onClick={closeMenu}
                    className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-orange-500
                    whitespace-nowrap
                    "
                >
                    🍔 FoodExpress
                </Link>


                {/* Desktop Navigation */}

                <div
                    className="
                    hidden
                    md:flex
                    items-center
                    gap-5
                    lg:gap-7
                    "
                >

                    <NavLink
                        to="/"
                        className={navClass}
                    >
                        Home
                    </NavLink>


                    <NavLink
                        to="/restaurants"
                        className={navClass}
                    >
                        Restaurants
                    </NavLink>


                    <NavLink
                        to="/orders"
                        className={navClass}
                    >
                        Orders
                    </NavLink>


                    <NavLink
                        to="/feedback"
                        className={navClass}
                    >
                        Feedback & Reviews
                    </NavLink>


                    {/* Cart */}

                    <Link
                        to="/cart"
                        className="
                        relative
                        text-gray-700
                        dark:text-gray-200
                        hover:text-orange-500
                        transition
                        "
                    >

                        🛒 Cart

                        {displayCount > 0 && (

                            <span
                                className="
                                absolute
                                -top-3
                                -right-4
                                bg-red-500
                                text-white
                                text-xs
                                w-5
                                h-5
                                rounded-full
                                flex
                                items-center
                                justify-center
                                font-bold
                                "
                            >
                                {displayCount}
                            </span>

                        )}

                    </Link>


                    {/* Profile */}

                    <NavLink
                        to="/profile"
                        className={navClass}
                    >
                        👤 <span className="max-w-[120px] lg:max-w-[150px] truncate inline-block align-bottom">{user ? user.name : "Profile"}</span>
                    </NavLink>


                    {/* Dark Mode */}

                    <button
                        onClick={toggleTheme}
                        className="
                        px-3
                        py-2
                        rounded-lg
                        bg-gray-100
                        dark:bg-gray-700
                        hover:bg-gray-200
                        dark:hover:bg-gray-600
                        transition
                        "
                        title="Toggle dark mode"
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </button>

                </div>


                {/* Mobile Controls */}
                <div className="md:hidden flex items-center gap-1.5">
                    {/* Mobile Cart */}
                    <Link
                        to="/cart"
                        className="relative p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-xl text-gray-700 dark:text-gray-200 hover:text-orange-500 transition"
                        aria-label="Shopping Cart"
                    >
                        🛒
                        {displayCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1 bg-red-500 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-xs"
                            >
                                {displayCount}
                            </span>
                        )}
                    </Link>

                    {/* Theme Button */}
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer"
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </button>

                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-2xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>
                </div>

            </div>


            {/* Mobile Menu */}
            {menuOpen && (
                <div
                    className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150"
                >
                    <NavLink
                        to="/"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">🏠</span>
                        <span>Home</span>
                    </NavLink>

                    <NavLink
                        to="/restaurants"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">🍽️</span>
                        <span>Restaurants</span>
                    </NavLink>

                    <NavLink
                        to="/orders"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">📦</span>
                        <span>Orders</span>
                    </NavLink>

                    <NavLink
                        to="/feedback"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">⭐</span>
                        <span>Feedback & Reviews</span>
                    </NavLink>

                    <NavLink
                        to="/cart"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">🛒</span>
                        <span>Cart ({displayCount})</span>
                    </NavLink>

                    <NavLink
                        to="/profile"
                        onClick={closeMenu}
                        className={mobileNavClass}
                    >
                        <span className="text-lg">👤</span>
                        <span className="truncate">{user ? user.name : "Profile"}</span>
                    </NavLink>
                </div>
            )}

        </nav>

    );

}


export default Navbar;