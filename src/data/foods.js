import pizza from "../assets/categories/pizza.jpg";
import burger from "../assets/categories/burger.jpg";
import biryani from "../assets/categories/biryani.jpg";

import pasta from "../assets/foods/pasta.jpg";
import misalpav from "../assets/foods/misalpav.jpg";
import friedrice from "../assets/foods/friedrice.jpg";
import noodles from "../assets/foods/hakkanoodles.jpg";
import momos from "../assets/foods/momos.jpg";
import paneer from "../assets/foods/paneer.jpg";
import dosa from "../assets/foods/dosa.jpg";
import idli from "../assets/foods/idli.jpg";
import pavbhaji from "../assets/foods/pavbhaji.jpg";
import chicken65 from "../assets/foods/chicken65.jpg";
import naan from "../assets/foods/naan.jpg";

import cake from "../assets/foods/cake.jpg";
import icecream from "../assets/foods/icecream.jpg";
import coffee from "../assets/foods/coffee.jpg";
import soda from "../assets/foods/soda.jpg";
import shake from "../assets/foods/shake.jpg";

const rawFoods = [
    // Pizza Palace - ID 1
    { id: 1, name: "Margherita Pizza", image: pizza, price: "₹299", type: "veg", isVeg: true, category: "Pizza", restaurantId: 1 },
    { id: 4, name: "White Sauce Pasta", image: pasta, price: "₹229", type: "veg", isVeg: true, category: "Italian", restaurantId: 1 },

    // Burger House - ID 2
    { id: 2, name: "Cheese Burger", image: burger, price: "₹199", type: "veg", isVeg: true, category: "Burger", restaurantId: 2 },
    { id: 12, name: "Pav Bhaji", image: pavbhaji, price: "₹179", type: "veg", isVeg: true, category: "Street Food", restaurantId: 2 },

    // Biryani Express - ID 3
    { id: 3, name: "Chicken Biryani", image: biryani, price: "₹249", type: "nonveg", isVeg: false, category: "Biryani", restaurantId: 3 },
    { id: 9, name: "Paneer Butter Masala", image: paneer, price: "₹289", type: "veg", isVeg: true, category: "Indian", restaurantId: 3 },
    { id: 14, name: "Butter Naan", image: naan, price: "₹49", type: "veg", isVeg: true, category: "Indian", restaurantId: 3 },

    // Chinese Corner - ID 4
    { id: 6, name: "Veg Fried Rice", image: friedrice, price: "₹189", type: "veg", isVeg: true, category: "Chinese", restaurantId: 4 },
    { id: 7, name: "Hakka Noodles", image: noodles, price: "₹199", type: "veg", isVeg: true, category: "Chinese", restaurantId: 4 },
    { id: 8, name: "Chicken Momos", image: momos, price: "₹169", type: "nonveg", isVeg: false, category: "Chinese", restaurantId: 4 },

    // Chicken Hub - ID 5
    { id: 13, name: "Chicken 65", image: chicken65, price: "₹279", type: "nonveg", isVeg: false, category: "Chicken", restaurantId: 5 },
    { id: 5, name: "Misal Pav", image: misalpav, price: "₹120", type: "veg", isVeg: true, category: "Maharashtrian", restaurantId: 5 },
    { id: 10, name: "Masala Dosa", image: dosa, price: "₹149", type: "veg", isVeg: true, category: "South Indian", restaurantId: 5 },
    { id: 11, name: "Idli Sambar", image: idli, price: "₹99", type: "veg", isVeg: true, category: "South Indian", restaurantId: 5 },
    { id: 15, name: "Chocolate Cake", image: cake, price: "₹149", type: "veg", isVeg: true, category: "Dessert", restaurantId: 5 },
    { id: 16, name: "Ice Cream", image: icecream, price: "₹99", type: "veg", isVeg: true, category: "Dessert", restaurantId: 5 },
    { id: 17, name: "Cold Coffee", image: coffee, price: "₹139", type: "veg", isVeg: true, category: "Beverage", restaurantId: 5 },
    { id: 18, name: "Fresh Lime Soda", image: soda, price: "₹79", type: "veg", isVeg: true, category: "Beverage", restaurantId: 5 },
    { id: 19, name: "Mango Shake", image: shake, price: "₹129", type: "veg", isVeg: true, category: "Beverage", restaurantId: 5 }
];

export const foods = rawFoods;
export default foods;
