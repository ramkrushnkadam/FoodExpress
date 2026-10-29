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
            justify-between
            gap-3
            sm:gap-4
            bg-white
            dark:bg-gray-800
            p-3.5
            sm:p-4
            rounded-xl
            shadow-xs
            border
            border-gray-100
            dark:border-gray-700
            mb-4
            min-w-0
            "
        >
            {/* Food Image + Info */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <img
                    src={item.image}
                    alt={item.name}
                    className="
                    w-20
                    h-20
                    sm:w-24
                    sm:h-24
                    object-cover
                    rounded-xl
                    shrink-0
                    bg-gray-100
                    dark:bg-gray-700
                    "
                />

                <div className="flex-1 min-w-0">
                    <h3
                        className="
                        font-bold
                        text-sm
                        sm:text-base
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
                            mt-0.5
                            "
                        >
                            {item.category}
                        </p>
                    )}

                    <p
                        className="
                        text-orange-500
                        font-semibold
                        mt-1
                        text-sm
                        "
                    >
                        {item.price}
                    </p>
                </div>
            </div>

            {/* Quantity Controls + Total + Remove */}
            <div
                className="
                flex
                items-center
                justify-between
                sm:justify-end
                gap-3
                sm:gap-4
                pt-2
                sm:pt-0
                border-t
                sm:border-0
                border-gray-100
                dark:border-gray-700
                w-full
                sm:w-auto
                "
            >
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                        onClick={() => decreaseQuantity(item.id)}
                        aria-label="Decrease quantity"
                        className="
                        w-9
                        h-9
                        min-w-[36px]
                        min-h-[36px]
                        bg-gray-100
                        dark:bg-gray-700
                        text-gray-800
                        dark:text-white
                        rounded-lg
                        font-bold
                        hover:bg-gray-200
                        dark:hover:bg-gray-600
                        transition
                        flex
                        items-center
                        justify-center
                        cursor-pointer
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
                        text-sm
                        sm:text-base
                        "
                    >
                        {item.quantity}
                    </span>

                    <button
                        onClick={() => increaseQuantity(item.id)}
                        aria-label="Increase quantity"
                        className="
                        w-9
                        h-9
                        min-w-[36px]
                        min-h-[36px]
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        rounded-lg
                        font-bold
                        transition
                        flex
                        items-center
                        justify-center
                        cursor-pointer
                        "
                    >
                        +
                    </button>
                </div>

                {/* Total */}
                <div className="min-w-[70px] sm:min-w-[80px] text-right">
                    <p className="font-bold text-orange-500 text-base">
                        ₹{itemTotal}
                    </p>
                </div>

                {/* Remove */}
                <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    className="
                    text-red-500
                    hover:text-red-700
                    text-xs
                    sm:text-sm
                    font-semibold
                    transition
                    p-1.5
                    cursor-pointer
                    "
                >
                    Remove
                </button>
            </div>
        </div>
    );
}

export default CartItem;
