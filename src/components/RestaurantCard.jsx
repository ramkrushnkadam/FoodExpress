import { Link } from "react-router-dom";


function RestaurantCard({ restaurant }) {

    return (

        <div
            className="
            bg-white
            dark:bg-gray-800
            rounded-xl
            shadow-md
            overflow-hidden
            hover:shadow-xl
            hover:-translate-y-1
            transition
            duration-300
            "
        >

            {/* Restaurant Image */}

            <Link to={`/restaurant/${restaurant.id}`}>

                <div className="h-36 overflow-hidden">

                    <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="
                        w-full
                        h-full
                        object-cover
                        hover:scale-105
                        transition
                        duration-300
                        "
                    />

                </div>

            </Link>


            {/* Content */}

            <div className="p-4">

                {/* Name + Rating */}

                <div
                    className="
                    flex
                    justify-between
                    items-start
                    gap-3
                    "
                >

                    <h3
                        className="
                        text-lg
                        font-bold
                        text-gray-800
                        dark:text-white
                        truncate
                        "
                    >
                        {restaurant.name}
                    </h3>


                    <span
                        className="
                        bg-green-100
                        text-green-700
                        px-2
                        py-1
                        rounded-lg
                        text-xs
                        font-semibold
                        whitespace-nowrap
                        "
                    >
                        ⭐ {restaurant.rating}
                    </span>

                </div>


                {/* Category */}

                <p
                    className="
                    text-gray-500
                    dark:text-gray-400
                    text-sm
                    mt-2
                    "
                >
                    {restaurant.category}
                </p>


                {/* Delivery + Location */}

                <div
                    className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:justify-between
                    gap-2
                    mt-3
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                    "
                >

                    <span>
                        🚚 {restaurant.deliveryTime}
                    </span>

                    <span className="truncate">
                        📍 {restaurant.location}
                    </span>

                </div>


                {/* View Menu */}

                <Link
                    to={`/restaurant/${restaurant.id}`}
                    className="
                    block
                    text-center
                    mt-4
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    py-2
                    rounded-lg
                    text-sm
                    font-semibold
                    transition
                    "
                >
                    View Menu
                </Link>

            </div>

        </div>

    );

}


export default RestaurantCard;