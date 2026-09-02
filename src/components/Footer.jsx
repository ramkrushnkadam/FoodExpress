import { Link } from "react-router-dom";


function Footer() {

    return (

        <footer
            className="
            bg-gray-900
            text-white
            mt-16
            "
        >

            <div
                className="
                max-w-7xl
                mx-auto
                px-6
                py-12
                "
            >

                <div
                    className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-10
                    "
                >

                    {/* Brand */}

                    <div>

                        <Link
                            to="/"
                            className="
                            text-2xl
                            font-bold
                            text-orange-500
                            "
                        >
                            🍔 FoodExpress
                        </Link>


                        <p
                            className="
                            text-gray-400
                            mt-4
                            leading-relaxed
                            max-w-sm
                            "
                        >
                            Delicious food delivered fast
                            at your doorstep.
                        </p>

                    </div>


                    {/* Quick Links */}

                    <div>

                        <h3
                            className="
                            text-xl
                            font-bold
                            mb-5
                            "
                        >
                            Quick Links
                        </h3>


                        <div
                            className="
                            flex
                            flex-col
                            gap-3
                            "
                        >

                            <Link
                                to="/"
                                className="
                                text-gray-400
                                hover:text-orange-500
                                transition
                                "
                            >
                                Home
                            </Link>


                            <Link
                                to="/restaurants"
                                className="
                                text-gray-400
                                hover:text-orange-500
                                transition
                                "
                            >
                                Restaurants
                            </Link>


                            <Link
                                to="/orders"
                                className="
                                text-gray-400
                                hover:text-orange-500
                                transition
                                "
                            >
                                Orders
                            </Link>


                            <Link
                                to="/cart"
                                className="
                                text-gray-400
                                hover:text-orange-500
                                transition
                                "
                            >
                                Cart
                            </Link>


                            <Link
                                to="/profile"
                                className="
                                text-gray-400
                                hover:text-orange-500
                                transition
                                "
                            >
                                Profile
                            </Link>

                        </div>

                    </div>


                    {/* Contact */}

                    <div>

                        <h3
                            className="
                            text-xl
                            font-bold
                            mb-5
                            "
                        >
                            Contact
                        </h3>


                        <div
                            className="
                            space-y-4
                            text-gray-400
                            "
                        >

                            <p>

                                📧{" "}

                                <a
                                    href="mailto:support@foodexpress.com"
                                    className="
                                    hover:text-orange-500
                                    transition
                                    "
                                >
                                    support@foodexpress.com
                                </a>

                            </p>


                            <p>
                                📞 +91 9876543210
                            </p>


                            <p>
                                📍 Maharashtra, India
                            </p>

                        </div>

                    </div>

                </div>


                {/* Divider */}

                <div
                    className="
                    border-t
                    border-gray-700
                    mt-10
                    pt-6
                    text-center
                    "
                >

                    <p className="text-gray-400">

                        © 2026 FoodExpress.
                        All Rights Reserved.

                    </p>

                </div>

            </div>

        </footer>

    );

}


export default Footer;