import { useCart } from "../context/CartContext";


function CartItem({ item }) {

    const {
        increaseQuantity,
        decreaseQuantity,
        removeFromCart
    } = useCart();


    const price = parseInt(
        String(item.price).replace("₹", "")
    );


    const itemTotal = price * item.quantity;


    return (

        <div
            className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            gap-4
            bg-white
            dark:bg-gray-800
            p-4
            rounded-xl
            shadow-sm
            border
            border-gray-100
            dark:border-gray-700
            mb-4
            "
        >

            {/* Food Image */}

            <img
                src={item.image}
                alt={item.name}
                className="
                w-full
                sm:w-24
                h-24
                object-cover
                rounded-lg
                flex-shrink-0
                "
            />


            {/* Food Information */}

            <div className="flex-1 min-w-0">

                <h3
                    className="
                    font-bold
                    text-base
                    text-gray-800
                    dark:text-white
                    truncate
                    "
                >
                    {item.name}
                </h3>


                {item.category && (

                    <p
                        className="
                        text-xs
                        text-gray-500
                        dark:text-gray-400
                        mt-1
                        "
                    >
                        {item.category}
                    </p>

                )}


                <p
                    className="
                    text-orange-500
                    font-semibold
                    mt-2
                    "
                >
                    {item.price}
                </p>

            </div>


            {/* Quantity Controls */}

            <div
                className="
                flex
                items-center
                gap-2
                "
            >

                <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="
                    w-8
                    h-8
                    bg-gray-200
                    dark:bg-gray-700
                    text-gray-800
                    dark:text-white
                    rounded-lg
                    font-bold
                    hover:bg-gray-300
                    dark:hover:bg-gray-600
                    transition
                    "
                >
                    −
                </button>


                <span
                    className="
                    w-8
                    text-center
                    font-bold
                    text-gray-800
                    dark:text-white
                    "
                >
                    {item.quantity}
                </span>


                <button
                    onClick={() => increaseQuantity(item.id)}
                    className="
                    w-8
                    h-8
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    rounded-lg
                    font-bold
                    transition
                    "
                >
                    +
                </button>

            </div>


            {/* Total */}

            <div
                className="
                min-w-[80px]
                text-right
                "
            >

                <p
                    className="
                    font-bold
                    text-orange-500
                    "
                >
                    ₹{itemTotal}
                </p>

            </div>


            {/* Remove */}

            <button
                onClick={() => removeFromCart(item.id)}
                className="
                text-red-500
                hover:text-red-700
                text-sm
                font-semibold
                transition
                "
            >
                Remove
            </button>

        </div>

    );

}


export default CartItem;