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
                        👤 {user ? user.name : "Profile"}
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

                <div className="
                md:hidden
                flex
                items-center
                gap-3
                "
                >

                    {/* Mobile Cart */}

                    <Link
                        to="/cart"
                        className="
                        relative
                        text-xl
                        text-gray-700
                        dark:text-gray-200
                        "
                    >

                        🛒

                        {displayCount > 0 && (

                            <span
                                className="
                                absolute
                                -top-2
                                -right-3
                                bg-red-500
                                text-white
                                text-xs
                                w-5
                                h-5
                                rounded-full
                                flex
                                items-center
                                justify-center
                                "
                            >
                                {displayCount}
                            </span>

                        )}

                    </Link>


                    {/* Theme Button */}

                    <button
                        onClick={toggleTheme}
                        className="
                        px-2
                        py-1
                        rounded-lg
                        bg-gray-100
                        dark:bg-gray-700
                        "
                    >
                        {darkMode ? "☀️" : "🌙"}
                    </button>


                    {/* Menu Button */}

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="
                        text-2xl
                        text-gray-700
                        dark:text-gray-200
                        "
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>

                </div>

            </div>


            {/* Mobile Menu */}

            {menuOpen && (

                <div
                    className="
                    md:hidden
                    border-t
                    border-gray-200
                    dark:border-gray-700
                    bg-white
                    dark:bg-gray-900
                    px-6
                    py-5
                    space-y-4
                    "
                >

                    <NavLink
                        to="/"
                        onClick={closeMenu}
                        className={navClass}
                    >
                        🏠 Home
                    </NavLink>


                    <NavLink
                        to="/restaurants"
                        onClick={closeMenu}
                        className={navClass}
                    >
                        🍽️ Restaurants
                    </NavLink>


                    <NavLink
                        to="/orders"
                        onClick={closeMenu}
                        className={navClass}
                    >
                        📦 Orders
                    </NavLink>


                    <NavLink
                        to="/cart"
                        onClick={closeMenu}
                        className={navClass}
                    >
                        🛒 Cart ({cart.length})
                    </NavLink>


                    <NavLink
                        to="/profile"
                        onClick={closeMenu}
                        className={navClass}
                    >
                        👤 {user ? user.name : "Profile"}
                    </NavLink>

                </div>

            )}

        </nav>

    );

}


export default Navbar;