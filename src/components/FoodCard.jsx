import { Link } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

function FoodCard({ food }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = () => {
    addToCart(food);
    showToast(`${food.name} added to cart`);
  };

  return (
    <div
      className="
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
      "
    >

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
            className="
              w-full
              h-full
              object-cover
              object-center
              group-hover:scale-105
              transition-transform
              duration-500
            "
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

          <div
            className="
              absolute
              top-3
              left-3
            "
          >
            {food.type === "veg" ? (
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

          {/* Rating Badge */}

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
            "
          >
            ★ 4.7
          </div>

        </div>
      </Link>


      {/* =========================
          CONTENT
      ========================== */}

      <div
        className="
          p-4
          flex
          flex-col
          min-h-[210px]
        "
      >

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


        {/* Rating */}

        <div
          className="
            flex
            items-center
            gap-2
            mt-3
          "
        >
          <span className="text-yellow-500 text-sm">
            ⭐⭐⭐⭐⭐
          </span>

          <span
            className="
              text-xs
              text-gray-500
              dark:text-gray-400
            "
          >
            4.7
          </span>
        </div>


        {/* Spacer */}
        <div className="flex-1" />


        {/* =========================
            PRICE + BUY NOW
        ========================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            mt-4
          "
        >

          {/* Price */}

          <span
            className="
              text-xl
              font-extrabold
              text-orange-500
            "
          >
            {food.price}
          </span>


          {/* Buy Now */}

          <button
            onClick={handleAddToCart}
            className="
              bg-orange-500
              hover:bg-orange-600
              active:scale-95
              text-white
              px-4
              py-2
              rounded-lg
              text-sm
              font-bold
              shadow-sm
              transition-all
              duration-200
            "
          >
            Buy Now
          </button>

        </div>


        {/* =========================
            ADD TO CART
        ========================== */}

        <button
          onClick={handleAddToCart}
          className="
            w-full
            mt-3
            bg-green-600
            hover:bg-green-700
            active:scale-[0.98]
            text-white
            py-2.5
            rounded-lg
            text-sm
            font-bold
            transition-all
            duration-200
          "
        >
          🛒 Add to Cart
        </button>

      </div>
    </div>
  );
}

export default FoodCard;