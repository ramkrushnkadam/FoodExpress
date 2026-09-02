
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function NotFound() {

    return (
        <div className="min-h-screen bg-gray-50">

            <Navbar />

            <main className="
                min-h-[70vh]
                flex
                flex-col
                items-center
                justify-center
                px-6
                text-center
            ">

                {/* 404 */}
                <div className="
                    text-8xl
                    sm:text-9xl
                    font-extrabold
                    text-orange-500
                ">
                    404
                </div>


                {/* Title */}
                <h1 className="
                    text-3xl
                    sm:text-4xl
                    font-bold
                    text-gray-800
                    mt-4
                ">
                    Page Not Found 😕
                </h1>


                {/* Description */}
                <p className="
                    text-gray-500
                    mt-3
                    max-w-md
                ">
                    Sorry, the page you are looking for
                    doesn't exist or may have been moved.
                </p>


                {/* Home Button */}
                <Link
                    to="/"
                    className="
                        mt-7
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        px-8
                        py-3
                        rounded-xl
                        font-bold
                        shadow-md
                        hover:shadow-lg
                        transition
                    "
                >
                    🏠 Go Back Home
                </Link>

            </main>


            <Footer />

        </div>
    );
}

export default NotFound;

