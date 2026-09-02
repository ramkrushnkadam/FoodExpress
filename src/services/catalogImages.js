import pizza from "../assets/categories/pizza.jpg";
import burger from "../assets/categories/burger.jpg";
import biryani from "../assets/categories/biryani.jpg";
import chinese from "../assets/categories/chinese.jpg";
import chicken from "../assets/categories/chicken.jpg";
import pasta from "../assets/foods/pasta.jpg";
import pavbhaji from "../assets/foods/pavbhaji.jpg";
import paneer from "../assets/foods/paneer.jpg";
import naan from "../assets/foods/naan.jpg";
import friedrice from "../assets/foods/friedrice.jpg";
import noodles from "../assets/foods/hakkanoodles.jpg";
import momos from "../assets/foods/momos.jpg";
import misalpav from "../assets/foods/misalpav.jpg";
import dosa from "../assets/foods/dosa.jpg";
import idli from "../assets/foods/idli.jpg";
import cake from "../assets/foods/cake.jpg";
import icecream from "../assets/foods/icecream.jpg";
import coffee from "../assets/foods/coffee.jpg";
import soda from "../assets/foods/soda.jpg";
import shake from "../assets/foods/shake.jpg";

const images = {
    "Pizza Palace": pizza,
    "Margherita Pizza": pizza,
    "Burger House": burger,
    "Cheese Burger": burger,
    "Biryani Express": biryani,
    "Chicken Biryani": biryani,
    "Chinese Corner": chinese,
    "Hakka Noodles": chinese,
    "Chicken Hub": chicken,
    "Chicken 65": chicken
    ,"White Sauce Pasta": pasta, "Pav Bhaji": pavbhaji, "Paneer Butter Masala": paneer, "Butter Naan": naan,
    "Veg Fried Rice": friedrice, "Hakka Noodles": noodles, "Chicken Momos": momos, "Misal Pav": misalpav,
    "Masala Dosa": dosa, "Idli Sambar": idli, "Chocolate Cake": cake, "Ice Cream": icecream,
    "Cold Coffee": coffee, "Fresh Lime Soda": soda, "Mango Shake": shake
};

export const catalogImage = (item) => images[item.name] || item.image;
