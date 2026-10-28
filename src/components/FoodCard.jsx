import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

function FoodCard({ food }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isAvailable = food.availability !== false;
  const ratingValue = typeof food.rating === "number" ? food.rating.toFixed(1) : "5.0";
  const ratingCount = typeof food.ratingCount === "number" ? food.ratingCount : 0;

  const handleAddToCart = () => {
    if (!isAvailable) {
      showToast(`${food.name} is currently unavailable.`, "error");
      return;
    }
    addToCart(food);
    showToast(`${food.name} added to cart`);
  };

  const handleBuyNow = () => {
    if (!isAvailable) {
      showToast(`${food.name} is currently unavailable.`, "error");
      return;
    }
    addToCart(food);
    navigate("/checkout");
  };

  return (
    <div
      className={`
        group
        h-full
        bg-white
        dark:bg-gray-800
        rounded-2xl
        overflow-hidden
        shadow-sm
        border
        border-gray-100
        dark:border-gray-700
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
        flex
        flex-col
        justify-between
        ${!isAvailable ? "opacity-90" : ""}
      `}
    >
      <div>
        {/* =========================
            FOOD IMAGE
        ========================== */}
        <Link to={`/food/${food.id}`}>
          <div
            className="
              relative
              w-full
              h-48
              sm:h-52
              overflow-hidden
              bg-gray-100
              dark:bg-gray-700
            "
          >
            <img
              src={food.image}
              alt={food.name}
              className={`
                w-full
                h-full
                object-cover
                object-center
                group-hover:scale-105
                transition-transform
                duration-500
                ${!isAvailable ? "grayscale-[40%]" : ""}
              `}
            />

            {/* Image Overlay */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/40
                via-transparent
                to-transparent
                pointer-events-none
              "
            />

            {/* Veg / Non-Veg Badge */}
            <div className="absolute top-3 left-3">
              {food.isVeg === true || food.type === "veg" ? (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    bg-white/95
                    text-green-700
                    px-2.5
                    py-1
                    rounded-full
                    text-xs
                    font-bold
                    shadow-md
                    backdrop-blur-sm
                  "
                >
                  🟢 Veg
                </span>
              ) : (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1
                    bg-white/95
                    text-red-700
                    px-2.5
                    py-1
                    rounded-full
                    text-xs
                    font-bold
                    shadow-md
                    backdrop-blur-sm
                  "
                >
                  🔴 Non Veg
                </span>
              )}
            </div>

            {/* Dynamic Rating Badge */}
            <div
              className="
                absolute
                bottom-3
                right-3
                bg-green-600
                text-white
                px-2.5
                py-1
                rounded-lg
                text-xs
                font-bold
                shadow-lg
                flex
                items-center
                gap-1
              "
            >
              <span>★</span>
              <span>{ratingValue}</span>
            </div>
          </div>
        </Link>

        {/* =========================
            CONTENT
        ========================== */}
        <div className="p-4 flex flex-col">
          {/* Food Name */}
          <Link
            to={`/food/${food.id}`}
            className="
              text-lg
              font-bold
              text-gray-800
              dark:text-white
              hover:text-orange-500
              transition
              line-clamp-2
              leading-snug
            "
          >
            {food.name}
          </Link>

          {/* Category */}
          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1.5
              truncate
            "
          >
            {food.category}
          </p>

          {/* Dynamic Rating Row */}
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-amber-400">★</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {ratingValue}
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              ({ratingCount})
            </span>
          </div>
        </div>
      </div>

      {/* =========================
          PRICE + STATUS + ACTIONS
      ========================== */}
      <div className="p-4 pt-0">
        {/* Price & Availability Status */}
        <div className="flex items-center justify-between gap-2 mb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-orange-500">
              ₹{food.price}
            </span>
            <span className="text-gray-400 text-sm">·</span>
            {isAvailable ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Available
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Unavailable
              </span>
            )}
          </div>

          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            disabled={!isAvailable}
            title={!isAvailable ? "Item currently unavailable" : "Order now"}
            className={`
              px-3.5
              py-1.5
              rounded-lg
              text-xs
              font-bold
              transition-all
              duration-200
              ${
                isAvailable
                  ? "bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Buy Now
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          title={!isAvailable ? "Item currently unavailable" : "Add item to cart"}
          className={`
            w-full
            py-2.5
            rounded-xl
            text-sm
            font-bold
            transition-all
            duration-200
            flex
            items-center
            justify-center
            gap-1.5
            ${
              isAvailable
                ? "bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-sm"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {isAvailable ? (
            <>
              <span>🛒</span>
              <span>Add to Cart</span>
            </>
          ) : (
            <span>Unavailable</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default FoodCard;
