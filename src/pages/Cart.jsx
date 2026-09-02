import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartItem from "../components/CartItem";

import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

import { useNavigate } from "react-router-dom";


function Cart() {

    const {
        cart,
        totalPrice,
        cartCount
    } = useCart();


    const { showToast } = useToast();

    const navigate = useNavigate();


    // Empty cart
    if (cart.length === 0) {

        return (

            <div className="min-h-screen bg-gray-50">

                <Navbar />

                <main className="
                    min-h-[70vh]
                    flex
                    items-center
                    justify-center
                    px-6
                ">

                    <div className="
                        bg-white
                        rounded-2xl
                        shadow-md
                        p-10
                        text-center
                        max-w-md
                        w-full
                    ">

                        <div className="text-7xl">
                            🛒
                        </div>


                        <h1 className="
                            text-3xl
                            font-bold
                            mt-5
                        ">
                            Your Cart is Empty
                        </h1>


                        <p className="
                            text-gray-500
                            mt-3
                        ">
                            Add some delicious food to your cart.
                        </p>


                        <button
                            onClick={() => navigate("/")}
                            className="
                                mt-6
                                bg-orange-500
                                hover:bg-orange-600
                                text-white
                                px-6
                                py-3
                                rounded-lg
                                font-bold
                            "
                        >
                            🍽️ Browse Food
                        </button>

                    </div>

                </main>

                <Footer />

            </div>

        );
    }


    // Proceed to checkout
    const handleCheckout = () => {

        if (cart.length === 0) {

            showToast(
                "Your cart is empty",
                "error"
            );

            return;
        }


        navigate("/checkout");

    };


    return (

        <div className="min-h-screen bg-gray-50">

            <Navbar />


            <main className="
                max-w-6xl
                mx-auto
                px-6
                py-10
            ">


                {/* Heading */}

                <div className="
                    flex
                    justify-between
                    items-center
                    mb-8
                ">

                    <div>

                        <h1 className="
                            text-3xl
                            md:text-4xl
                            font-bold
                        ">
                            Your Cart 🛒
                        </h1>


                        <p className="
                            text-gray-500
                            mt-2
                        ">
                            {cartCount} item
                            {cartCount !== 1 ? "s" : ""}
                        </p>

                    </div>

                </div>


                <div className="
                    grid
                    lg:grid-cols-3
                    gap-8
                ">


                    {/* Cart Items */}

                    <div className="
                        lg:col-span-2
                        bg-white
                        rounded-2xl
                        shadow-md
                        p-6
                    ">

                        {cart.map((item) => (

                            <CartItem
                                key={item.id}
                                item={item}
                            />

                        ))}

                    </div>


                    {/* Order Summary */}

                    <div className="
                        bg-white
                        rounded-2xl
                        shadow-md
                        p-6
                        h-fit
                        lg:sticky
                        lg:top-24
                    ">

                        <h2 className="
                            text-2xl
                            font-bold
                            mb-6
                        ">
                            Order Summary
                        </h2>


                        <div className="
                            flex
                            justify-between
                            text-gray-600
                            mb-4
                        ">

                            <span>
                                Items
                            </span>

                            <span>
                                {cartCount}
                            </span>

                        </div>


                        <div className="
                            flex
                            justify-between
                            text-gray-600
                            mb-4
                        ">

                            <span>
                                Subtotal
                            </span>

                            <span>
                                ₹{totalPrice}
                            </span>

                        </div>


                        <div className="
                            flex
                            justify-between
                            text-gray-600
                            mb-4
                        ">

                            <span>
                                Delivery
                            </span>

                            <span className="text-green-600">
                                FREE
                            </span>

                        </div>


                        <div className="
                            border-t
                            pt-5
                            flex
                            justify-between
                            items-center
                        ">

                            <span className="
                                text-lg
                                font-bold
                            ">
                                Total
                            </span>


                            <span className="
                                text-2xl
                                font-bold
                                text-orange-500
                            ">
                                ₹{totalPrice}
                            </span>

                        </div>


                        {/* Checkout */}

                        <button
                            onClick={handleCheckout}
                            className="
                                w-full
                                mt-6
                                bg-orange-500
                                hover:bg-orange-600
                                text-white
                                py-3
                                rounded-lg
                                font-bold
                                text-lg
                                transition
                            "
                        >
                            💳 Proceed To Checkout
                        </button>


                        {/* Continue Shopping */}

                        <button
                            onClick={() => navigate("/")}
                            className="
                                w-full
                                mt-3
                                border
                                border-gray-300
                                hover:bg-gray-100
                                text-gray-700
                                py-3
                                rounded-lg
                                font-semibold
                                transition
                            "
                        >
                            ← Continue Shopping
                        </button>

                    </div>

                </div>

            </main>


            <Footer />

        </div>

    );

}


export default Cart;