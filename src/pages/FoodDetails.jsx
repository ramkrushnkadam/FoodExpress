import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getFood } from "../services/catalogApi";

function FoodDetails() {
    const { id } = useParams(), { addToCart } = useCart(), { showToast } = useToast();
    const [food, setFood] = useState(null), [error, setError] = useState("");
    useEffect(() => { getFood(id).then(setFood).catch((e) => setError(e.message || "Food not found")); }, [id]);
    return <div className="min-h-screen bg-gray-50"><Navbar/><main className="mx-auto min-h-[70vh] max-w-5xl px-6 py-10">{error ? <p className="text-red-600">{error}</p> : !food ? <p>Loading food...</p> : <><Link to={`/restaurant/${food.restaurantId}`} className="text-orange-600">← Back to menu</Link><div className="mt-6 grid overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-2"><img className="h-72 w-full object-cover md:h-full" src={food.image} alt={food.name}/><div className="p-8"><span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">{food.category}</span><h1 className="mt-5 text-3xl font-bold">{food.name}</h1><p className="mt-4 text-3xl font-bold text-orange-500">₹{food.price}</p><p className="mt-5 text-gray-600">{food.description || `Delicious ${food.name} prepared fresh.`}</p><button onClick={() => { addToCart(food); showToast(`${food.name} added to cart`); }} className="mt-8 w-full rounded-lg bg-orange-500 py-3 font-bold text-white">Add to Cart</button><Link to="/cart" className="mt-3 block text-center text-orange-600">View cart</Link></div></div></>}</main><Footer/></div>;
}
export default FoodDetails;
