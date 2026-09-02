import pizza from "../assets/categories/pizza.jpg";
import burger from "../assets/categories/burger.jpg";
import biryani from "../assets/categories/biryani.jpg";
import chinese from "../assets/categories/chinese.jpg";
import chicken from "../assets/categories/chicken.jpg";

const restaurants = [
    {
        id: 1,
        name: "Pizza Palace",
        image: pizza,
        category: "Pizza, Italian",
        rating: 4.6,
        deliveryTime: "25-30 min",
        location: "Main Road",
    },

    {
        id: 2,
        name: "Burger House",
        image: burger,
        category: "Burger, Fast Food",
        rating: 4.4,
        deliveryTime: "20-25 min",
        location: "Market Road",
    },

    {
        id: 3,
        name: "Biryani Express",
        image: biryani,
        category: "Biryani, Indian",
        rating: 4.7,
        deliveryTime: "30-35 min",
        location: "Station Road",
    },

    {
        id: 4,
        name: "Chinese Corner",
        image: chinese,
        category: "Chinese, Noodles",
        rating: 4.3,
        deliveryTime: "25-30 min",
        location: "College Road",
    },

    {
        id: 5,
        name: "Chicken Hub",
        image: chicken,
        category: "Chicken, Non-Veg",
        rating: 4.5,
        deliveryTime: "30-35 min",
        location: "City Center",
    },
];

export default restaurants;