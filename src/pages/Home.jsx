import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FoodCard from "../components/FoodCard";
import SearchBar from "../components/SearchBar";

import hero from "../assets/hero.jpg";

import { getFoods } from "../services/catalogApi";


function Home() {

    const [filter, setFilter] = useState("all");

    const [priceFilter, setPriceFilter] = useState("all");

    const [search, setSearch] = useState("");
    const [foods, setFoods] = useState([]);
    const [catalogError, setCatalogError] = useState("");

    useEffect(() => {
        getFoods().then(setFoods).catch((error) => setCatalogError(error.message || "Unable to load the menu."));
    }, []);


    // Copy original foods
    let filteredFoods = [...foods];


    // -------------------------
    // Search Filter
    // -------------------------

    filteredFoods = filteredFoods.filter((food) =>

        food.name
            .toLowerCase()
            .includes(search.toLowerCase())

    );


    // -------------------------
    // Veg / Non Veg Filter
    // -------------------------

    if (filter !== "all") {

        filteredFoods = filteredFoods.filter(

            (food) => food.type === filter

        );

    }


    // -------------------------
    // Price Sorting
    // -------------------------

    const getPrice = (food) => {

        return parseInt(

            String(food.price)
                .replace(/[₹,]/g, "")

        ) || 0;

    };


    if (priceFilter === "low") {

        filteredFoods.sort(

            (a, b) => getPrice(a) - getPrice(b)

        );

    }


    if (priceFilter === "high") {

        filteredFoods.sort(

            (a, b) => getPrice(b) - getPrice(a)

        );

    }


    // -------------------------
    // Price Range
    // -------------------------

    if (priceFilter === "under150") {

        filteredFoods = filteredFoods.filter(

            (food) => getPrice(food) < 150

        );

    }


    if (priceFilter === "150to250") {

        filteredFoods = filteredFoods.filter(

            (food) => {

                const price = getPrice(food);

                return price >= 150 && price <= 250;

            }

        );

    }


    if (priceFilter === "above250") {

        filteredFoods = filteredFoods.filter(

            (food) => getPrice(food) > 250

        );

    }


    return (

        <div
            className="
            min-h-screen
            bg-gray-50
            dark:bg-gray-950
            "
        >

            {catalogError && <p className="mx-auto max-w-7xl px-6 pt-4 text-red-600">{catalogError}</p>}
            {/* =========================
                NAVBAR
            ========================== */}

            <Navbar />


            {/* =========================
                HERO SECTION
            ========================== */}

            {/* =========================
    HERO SECTION
========================= */}

<section className="relative w-full overflow-hidden">

  {/* Hero Image */}
  <img
    src={hero}
    alt="Delicious food"
    className="
      absolute
      inset-0
      w-full
      h-full
      object-cover
    "
  />

  {/* Gradient Overlay */}
  <div
    className="
      absolute
      inset-0
      bg-gradient-to-r
      from-black/80
      via-black/55
      to-black/10
    "
  />

  {/* Hero Content */}
  <div
    className="
      relative
      z-10
      max-w-7xl
      mx-auto
      px-6
      sm:px-8
      lg:px-10
      min-h-[520px]
      flex
      items-center
    "
  >

    <div className="max-w-xl text-white">

      {/* Small Badge */}
      <div
        className="
          inline-flex
          items-center
          gap-2
          bg-white/15
          backdrop-blur-md
          border
          border-white/20
          px-4
          py-2
          rounded-full
          text-sm
          font-medium
          mb-6
        "
      >
        🍽️ India's favourite food delivery
      </div>

      {/* Heading */}
      <h1
        className="
          text-4xl
          sm:text-5xl
          lg:text-6xl
          font-extrabold
          leading-[1.1]
          tracking-tight
        "
      >
        Delicious food,
        <br />

        <span className="text-orange-400">
          delivered to you.
        </span>
      </h1>

      {/* Description */}
      <p
        className="
          mt-5
          text-lg
          sm:text-xl
          text-gray-200
          leading-relaxed
        "
      >
        Order food from your favourite restaurants
        and get it delivered fast to your doorstep.
      </p>

      {/* Search Box */}
      <div
        className="
          mt-8
          flex
          flex-col
          sm:flex-row
          bg-white
          rounded-xl
          shadow-2xl
          overflow-hidden
          max-w-xl
        "
      >

        {/* Location */}
        <div
          className="
            flex
            items-center
            gap-3
            px-5
            py-4
            text-gray-600
            flex-1
            border-b
            sm:border-b-0
            sm:border-r
            border-gray-200
          "
        >
          <span className="text-xl">
            📍
          </span>

          <input
            type="text"
            placeholder="Enter your location"
            className="
              w-full
              outline-none
              text-gray-800
              placeholder-gray-400
            "
          />
        </div>

        {/* Search */}
        <button
          onClick={() => {
            document
              .getElementById("popular-foods")
              ?.scrollIntoView({
                behavior: "smooth"
              });
          }}
          className="
            bg-orange-500
            hover:bg-orange-600
            text-white
            px-7
            py-4
            font-bold
            transition
            duration-200
            whitespace-nowrap
          "
        >
          Search
        </button>

      </div>

      {/* Quick Info */}
      <div
        className="
          flex
          flex-wrap
          gap-x-6
          gap-y-3
          mt-6
          text-sm
          text-gray-200
        "
      >
        <span>✓ 30 min delivery</span>
        <span>✓ Fresh food</span>
        <span>✓ Secure payment</span>
      </div>

    </div>
  </div>
</section>


            {/* =========================
                POPULAR FOOD SECTION
            ========================== */}

            <section
                id="popular-foods"
                className="
                max-w-7xl
                mx-auto
                px-4
                sm:px-6
                lg:px-8
                py-16
                "
            >

                <div
                    className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-6
                    "
                >

                    <div>

                        <h2
                            className="
                            text-3xl
                            sm:text-4xl
                            font-bold
                            text-gray-800
                            dark:text-white
                            "
                        >
                            Popular Dishes
                        </h2>


                        <p
                            className="
                            text-gray-500
                            dark:text-gray-400
                            mt-2
                            "
                        >
                            Choose from our most loved dishes.
                        </p>

                    </div>


                    {/* Search */}

                    <div
                        className="
                        w-full
                        lg:w-80
                        "
                    >

                        <SearchBar
                            search={search}
                            setSearch={setSearch}
                        />

                    </div>

                </div>


                {/* =========================
                    FILTERS
                ========================== */}

                <div className="mt-8">

                    <h3
                        className="
                        text-sm
                        font-semibold
                        text-gray-500
                        dark:text-gray-400
                        mb-3
                        "
                    >
                        Food Type
                    </h3>


                    <div
                        className="
                        flex
                        flex-wrap
                        gap-3
                        "
                    >

                        <button
                            onClick={() => setFilter("all")}
                            className={`
                            px-5
                            py-2
                            rounded-lg
                            text-sm
                            font-semibold
                            transition
                            ${
                                filter === "all"
                                    ? "bg-orange-600 text-white"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }
                            `}
                        >
                            All
                        </button>


                        <button
                            onClick={() => setFilter("veg")}
                            className={`
                            px-5
                            py-2
                            rounded-lg
                            text-sm
                            font-semibold
                            transition
                            ${
                                filter === "veg"
                                    ? "bg-green-600 text-white"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                            }
                            `}
                        >
                            🥗 Veg
                        </button>


                        <button
                            onClick={() => setFilter("nonveg")}
                            className={`
                            px-5
                            py-2
                            rounded-lg
                            text-sm
                            font-semibold
                            transition
                            ${
                                filter === "nonveg"
                                    ? "bg-red-600 text-white"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                            }
                            `}
                        >
                            🍗 Non Veg
                        </button>

                    </div>


                    {/* Price Filters */}

                    <h3
                        className="
                        text-sm
                        font-semibold
                        text-gray-500
                        dark:text-gray-400
                        mt-6
                        mb-3
                        "
                    >
                        Price
                    </h3>


                    <div
                        className="
                        flex
                        flex-wrap
                        gap-3
                        "
                    >

                        <button
                            onClick={() => setPriceFilter("all")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-gray-200
                            hover:bg-gray-300
                            text-gray-800
                            font-semibold
                            "
                        >
                            All Prices
                        </button>


                        <button
                            onClick={() => setPriceFilter("low")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-blue-500
                            hover:bg-blue-600
                            text-white
                            font-semibold
                            "
                        >
                            ₹ Low → High
                        </button>


                        <button
                            onClick={() => setPriceFilter("high")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-indigo-500
                            hover:bg-indigo-600
                            text-white
                            font-semibold
                            "
                        >
                            ₹ High → Low
                        </button>


                        <button
                            onClick={() => setPriceFilter("under150")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-green-500
                            hover:bg-green-600
                            text-white
                            font-semibold
                            "
                        >
                            Under ₹150
                        </button>


                        <button
                            onClick={() => setPriceFilter("150to250")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-yellow-400
                            hover:bg-yellow-500
                            text-black
                            font-semibold
                            "
                        >
                            ₹150 - ₹250
                        </button>


                        <button
                            onClick={() => setPriceFilter("above250")}
                            className="
                            px-4
                            py-2
                            rounded-lg
                            text-sm
                            bg-red-500
                            hover:bg-red-600
                            text-white
                            font-semibold
                            "
                        >
                            Above ₹250
                        </button>

                    </div>

                </div>


                {/* =========================
                    FOOD GRID
                ========================== */}

                {filteredFoods.length > 0 ? (

                    <div
                        className="
                        grid
                        grid-cols-2
                        sm:grid-cols-2
                        md:grid-cols-3
                        lg:grid-cols-4
                        gap-4
                        sm:gap-5
                        lg:gap-6
                        mt-10
                        "
                    >

                        {filteredFoods.map((food) => (

                            <FoodCard
                                key={food.id}
                                food={food}
                            />

                        ))}

                    </div>

                ) : (

                    <div
                        className="
                        text-center
                        py-16
                        "
                    >

                        <div className="text-5xl">
                            🔍
                        </div>

                        <h3
                            className="
                            text-xl
                            font-bold
                            mt-4
                            text-gray-800
                            dark:text-white
                            "
                        >
                            No food found
                        </h3>

                        <p
                            className="
                            text-gray-500
                            dark:text-gray-400
                            mt-2
                            "
                        >
                            Try another food name or filter.
                        </p>

                    </div>

                )}

            </section>


            {/* =========================
                OFFER SECTION
            ========================== */}

            <section
                className="
                bg-gradient-to-r
                from-red-500
                to-orange-500
                text-white
                "
            >

                <div
                    className="
                    max-w-7xl
                    mx-auto
                    px-6
                    py-16
                    text-center
                    "
                >

                    <h2
                        className="
                        text-3xl
                        sm:text-4xl
                        font-bold
                        "
                    >
                        🔥 Weekend Mega Offer
                    </h2>


                    <p
                        className="
                        text-xl
                        sm:text-2xl
                        mt-5
                        "
                    >
                        Flat 30% OFF Above ₹999
                    </p>


                    <p className="mt-4">
                        Use Coupon Code
                    </p>


                    <div
                        className="
                        inline-block
                        bg-white
                        text-red-600
                        px-7
                        py-3
                        rounded-xl
                        text-xl
                        font-bold
                        mt-3
                        "
                    >
                        FOOD30
                    </div>

                </div>

            </section>


            {/* =========================
                WHY CHOOSE US
            ========================== */}

            <section
                className="
                max-w-7xl
                mx-auto
                px-6
                py-16
                "
            >

                <h2
                    className="
                    text-3xl
                    sm:text-4xl
                    font-bold
                    text-center
                    text-gray-800
                    dark:text-white
                    mb-12
                    "
                >
                    Why Choose FoodExpress?
                </h2>


                <div
                    className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-4
                    gap-6
                    "
                >

                    {[
                        {
                            icon: "🚚",
                            title: "Fast Delivery",
                            text: "Delivery within 30 minutes."
                        },
                        {
                            icon: "🍽️",
                            title: "Fresh Food",
                            text: "Prepared with fresh ingredients."
                        },
                        {
                            icon: "💳",
                            title: "Secure Payment",
                            text: "Safe online payment options."
                        },
                        {
                            icon: "⭐",
                            title: "Top Rated",
                            text: "Thousands of happy customers."
                        }
                    ].map((item) => (

                        <div
                            key={item.title}
                            className="
                            bg-white
                            dark:bg-gray-800
                            p-7
                            rounded-xl
                            shadow-md
                            text-center
                            "
                        >

                            <div className="text-5xl">
                                {item.icon}
                            </div>


                            <h3
                                className="
                                text-xl
                                font-bold
                                mt-4
                                text-gray-800
                                dark:text-white
                                "
                            >
                                {item.title}
                            </h3>


                            <p
                                className="
                                text-gray-500
                                dark:text-gray-400
                                mt-2
                                text-sm
                                "
                            >
                                {item.text}
                            </p>

                        </div>

                    ))}

                </div>

            </section>


            {/* =========================
                FOOTER
            ========================== */}

            <Footer />

        </div>

    );

}


export default Home; 
