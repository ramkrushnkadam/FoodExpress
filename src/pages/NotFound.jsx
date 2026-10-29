import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between">
            <Navbar />

            <main className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center w-full flex-1">
                {/* 404 */}
                <div className="text-7xl sm:text-9xl font-extrabold text-orange-500">
                    404
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-white mt-4">
                    Page Not Found 😕
                </h1>

                {/* Description */}
                <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-md text-sm sm:text-base">
                    Sorry, the page you are looking for doesn't exist or may have been moved.
                </p>

                {/* Home Button */}
                <Link
                    to="/"
                    className="mt-7 inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 min-h-[44px] rounded-xl font-bold shadow-md transition cursor-pointer"
                >
                    🍽️ Back to Home
                </Link>
            </main>

            <Footer />
        </div>
    );
}

export default NotFound;
