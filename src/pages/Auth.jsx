import { useState } from "react";

import { useAuth } from "../context/AuthContext";

import { useNavigate } from "react-router-dom";


function Auth() {

    const {
        register,
        login
    } = useAuth();


    const navigate = useNavigate();


    const [isLogin, setIsLogin] = useState(true);

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    const [form, setForm] = useState({

        name: "",

        email: "",

        password: "",

        mobile: "",

        address: ""

    });


    // ==========================================
    // Handle input
    // ==========================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setForm((prev) => ({

            ...prev,

            [name]: value

        }));


        setError("");

        setSuccess("");

    };


    // ==========================================
    // Submit
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        setError("");

        setSuccess("");


        // ==========================================
        // Basic validation
        // ==========================================

        if (!form.email.trim()) {

            setError(
                "Please enter your email."
            );

            return;

        }


        if (!form.password) {

            setError(
                "Please enter your password."
            );

            return;

        }


        if (form.password.length < 6) {

            setError(
                "Password must contain at least 6 characters."
            );

            return;

        }


        // ==========================================
        // Registration validation
        // ==========================================

        if (!isLogin) {

            if (!form.name.trim()) {

                setError(
                    "Please enter your name."
                );

                return;

            }


            if (!form.mobile.trim()) {

                setError(
                    "Please enter your mobile number."
                );

                return;

            }


            if (!/^[0-9]{10}$/.test(form.mobile)) {

                setError(
                    "Please enter a valid 10-digit mobile number."
                );

                return;

            }

        }


        setLoading(true);


        try {

            // ==========================================
            // LOGIN
            // ==========================================

            if (isLogin) {

                const result = await login(
                    form.email.trim(),
                    form.password
                );


                if (result.success) {

                    navigate("/profile");

                } else {

                    setError(
                        result.message ||
                        "Invalid email or password."
                    );

                }


                return;

            }


            // ==========================================
            // REGISTER
            // ==========================================

            const result = await register({

                name: form.name.trim(),

                email: form.email.trim(),

                password: form.password,

                mobile: form.mobile.trim(),

                address: form.address.trim()

            });


            if (!result.success) {

                setError(
                    result.message ||
                    "Registration failed. Please try again."
                );

                return;

            }


            setSuccess(
                "Registration successful! Please login."
            );


            setForm({

                name: "",

                email: "",

                password: "",

                mobile: "",

                address: ""

            });


            setIsLogin(true);


        } catch (error) {

            console.error(
                "Authentication Error:",
                error
            );


            setError(
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // Switch Login/Register
    // ==========================================

    const toggleMode = () => {

        setIsLogin(!isLogin);

        setError("");

        setSuccess("");

        setShowPassword(false);


        setForm({

            name: "",

            email: "",

            password: "",

            mobile: "",

            address: ""

        });

    };


    return (

        <div
            className="
                min-h-screen
                bg-gray-50
                dark:bg-gray-950
            "
        >

            {/* ==========================================
                Main
            ========================================== */}

            <div
                className="
                    min-h-screen
                    flex
                    items-center
                    justify-center
                    px-4
                    py-12
                "
            >

                <div
                    className="
                        w-full
                        max-w-md
                    "
                >

                    {/* ==========================================
                        Logo
                    ========================================== */}

                    <div
                        className="
                            text-center
                            mb-8
                        "
                    >

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="
                                text-3xl
                                font-bold
                                text-orange-500
                            "
                        >
                            🍔 FoodExpress
                        </button>


                        <p
                            className="
                                text-gray-500
                                dark:text-gray-400
                                mt-2
                            "
                        >

                            {isLogin

                                ? "Welcome back!"

                                : "Create your FoodExpress account"

                            }

                        </p>

                    </div>


                    {/* ==========================================
                        Card
                    ========================================== */}

                    <div
                        className="
                            bg-white
                            dark:bg-gray-800
                            rounded-2xl
                            shadow-xl
                            p-6
                            sm:p-8
                        "
                    >

                        {/* Heading */}

                        <h1
                            className="
                                text-2xl
                                font-bold
                                text-center
                                text-gray-800
                                dark:text-white
                                mb-6
                            "
                        >

                            {isLogin
                                ? "Login"
                                : "Create Account"
                            }

                        </h1>


                        {/* ==========================================
                            Error
                        ========================================== */}

                        {error && (

                            <div
                                className="
                                    bg-red-100
                                    text-red-700
                                    px-4
                                    py-3
                                    rounded-lg
                                    mb-5
                                    text-sm
                                "
                            >
                                {error}
                            </div>

                        )}


                        {/* ==========================================
                            Success
                        ========================================== */}

                        {success && (

                            <div
                                className="
                                    bg-green-100
                                    text-green-700
                                    px-4
                                    py-3
                                    rounded-lg
                                    mb-5
                                    text-sm
                                "
                            >
                                {success}
                            </div>

                        )}


                        {/* ==========================================
                            Form
                        ========================================== */}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >

                            {/* ==========================================
                                Name
                            ========================================== */}

                            {!isLogin && (

                                <div>

                                    <label
                                        className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            dark:text-gray-200
                                            mb-2
                                        "
                                    >
                                        Full Name
                                    </label>


                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your name"
                                        value={form.name}
                                        onChange={handleChange}
                                        className="
                                            w-full
                                            px-4
                                            py-3
                                            border
                                            border-gray-200
                                            dark:border-gray-600
                                            rounded-lg
                                            outline-none
                                            bg-white
                                            dark:bg-gray-700
                                            text-gray-800
                                            dark:text-white
                                            focus:ring-2
                                            focus:ring-orange-500
                                        "
                                    />

                                </div>

                            )}


                            {/* ==========================================
                                Email
                            ========================================== */}

                            <div>

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-semibold
                                        text-gray-700
                                        dark:text-gray-200
                                        mb-2
                                    "
                                >
                                    Email
                                </label>


                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    className="
                                        w-full
                                        px-4
                                        py-3
                                        border
                                        border-gray-200
                                        dark:border-gray-600
                                        rounded-lg
                                        outline-none
                                        bg-white
                                        dark:bg-gray-700
                                        text-gray-800
                                        dark:text-white
                                        focus:ring-2
                                        focus:ring-orange-500
                                    "
                                />

                            </div>


                            {/* ==========================================
                                Mobile
                            ========================================== */}

                            {!isLogin && (

                                <div>

                                    <label
                                        className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            dark:text-gray-200
                                            mb-2
                                        "
                                    >
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
                                        className="
                                            w-full
                                            px-4
                                            py-3
                                            border
                                            border-gray-200
                                            dark:border-gray-600
                                            rounded-lg
                                            outline-none
                                            bg-white
                                            dark:bg-gray-700
                                            text-gray-800
                                            dark:text-white
                                            focus:ring-2
                                            focus:ring-orange-500
                                        "
                                    />

                                </div>

                            )}


                            {/* ==========================================
                                Address
                            ========================================== */}

                            {!isLogin && (

                                <div>

                                    <label
                                        className="
                                            block
                                            text-sm
                                            font-semibold
                                            text-gray-700
                                            dark:text-gray-200
                                            mb-2
                                        "
                                    >
                                        Address
                                    </label>


                                    <textarea
                                        name="address"
                                        placeholder="Enter your address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows="3"
                                        className="
                                            w-full
                                            px-4
                                            py-3
                                            border
                                            border-gray-200
                                            dark:border-gray-600
                                            rounded-lg
                                            outline-none
                                            resize-none
                                            bg-white
                                            dark:bg-gray-700
                                            text-gray-800
                                            dark:text-white
                                            focus:ring-2
                                            focus:ring-orange-500
                                        "
                                    />

                                </div>

                            )}


                            {/* ==========================================
                                Password
                            ========================================== */}

                            <div>

                                <label
                                    className="
                                        block
                                        text-sm
                                        font-semibold
                                        text-gray-700
                                        dark:text-gray-200
                                        mb-2
                                    "
                                >
                                    Password
                                </label>


                                <div className="relative">

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={handleChange}
                                        autoComplete={
                                            isLogin
                                                ? "current-password"
                                                : "new-password"
                                        }
                                        className="
                                            w-full
                                            px-4
                                            py-3
                                            pr-12
                                            border
                                            border-gray-200
                                            dark:border-gray-600
                                            rounded-lg
                                            outline-none
                                            bg-white
                                            dark:bg-gray-700
                                            text-gray-800
                                            dark:text-white
                                            focus:ring-2
                                            focus:ring-orange-500
                                        "
                                    />


                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                        className="
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-gray-500
                                        "
                                    >

                                        {showPassword
                                            ? "🙈"
                                            : "👁️"
                                        }

                                    </button>

                                </div>

                            </div>


                            {/* ==========================================
                                Submit
                            ========================================== */}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full
                                    py-3
                                    rounded-lg
                                    font-bold
                                    transition
                                    text-white
                                    ${
                                        loading
                                            ? "bg-orange-300 cursor-not-allowed"
                                            : "bg-orange-500 hover:bg-orange-600"
                                    }
                                `}
                            >

                                {loading

                                    ? (
                                        isLogin
                                            ? "Logging in..."
                                            : "Creating Account..."
                                    )

                                    : (
                                        isLogin
                                            ? "Login"
                                            : "Create Account"
                                    )

                                }

                            </button>

                        </form>


                        {/* ==========================================
                            Switch Login/Register
                        ========================================== */}

                        <div
                            className="
                                text-center
                                mt-6
                            "
                        >

                            <span
                                className="
                                    text-gray-500
                                    dark:text-gray-400
                                    text-sm
                                "
                            >

                                {isLogin
                                    ? "Don't have an account?"
                                    : "Already have an account?"
                                }

                            </span>


                            <button
                                type="button"
                                onClick={toggleMode}
                                className="
                                    ml-2
                                    text-orange-500
                                    font-semibold
                                    hover:text-orange-600
                                "
                            >

                                {isLogin
                                    ? "Register"
                                    : "Login"
                                }

                            </button>

                        </div>


                        {/* ==========================================
                            Home
                        ========================================== */}

                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="
                                w-full
                                mt-5
                                text-gray-500
                                dark:text-gray-400
                                hover:text-orange-500
                                text-sm
                            "
                        >
                            ← Back to Home
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Auth;