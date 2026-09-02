import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FoodCard from "../components/FoodCard";
import RestaurantCard from "../components/RestaurantCard";
import { getFoods, getRestaurant, getRestaurants } from "../services/catalogApi";

function Restaurant() {
    const { id } = useParams();
    const [restaurants, setRestaurants] = useState([]), [restaurant, setRestaurant] = useState(null), [foods, setFoods] = useState([]), [error, setError] = useState(""), [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true); setError("");
        const request = id ? Promise.all([getRestaurant(id), getFoods(id)]).then(([item, menu]) => { setRestaurant(item); setFoods(menu); }) : getRestaurants().then(setRestaurants);
        request.catch((e) => setError(e.message || "Unable to load restaurants.")).finally(() => setLoading(false));
    }, [id]);
    const content = loading ? <p className="py-16 text-center text-gray-500">Loading menu...</p> : error ? <p className="py-16 text-center text-red-600">{error}</p> : !id ? <><h1 className="mb-8 text-3xl font-bold">All Restaurants</h1><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{restaurants.map((item) => <RestaurantCard key={item.id} restaurant={item} />)}</div></> : <>{restaurant && <div className="overflow-hidden rounded-2xl bg-white shadow-md"><img src={restaurant.image} alt={restaurant.name} className="h-48 w-full object-cover md:h-64"/><div className="p-6"><h1 className="text-3xl font-bold">{restaurant.name}</h1><p className="mt-2 text-gray-500">{restaurant.category} · {restaurant.location} · {restaurant.deliveryTime}</p></div></div>}<div className="mt-10 flex justify-between"><h2 className="text-2xl font-bold">Menu</h2><span className="text-gray-500">{foods.length} items</span></div><div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{foods.map((food) => <FoodCard key={food.id} food={food} />)}</div></>;
    return <div className="min-h-screen bg-gray-50"><Navbar/><main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-12">{content}{error && <Link className="mt-4 inline-block text-orange-600" to="/restaurants">View restaurants</Link>}</main><Footer/></div>;
}
export default Restaurant;
