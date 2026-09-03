import { apiRequest } from "./api";
import { catalogImage } from "./catalogImages";

const NON_VEG_PATTERNS = /chicken|mutton|fish|prawn|egg|meat|beef|pork|bacon|seafood|non-?veg/i;

export const isVegetarian = (food) => {
    if (food.isVeg !== undefined) return Boolean(food.isVeg);
    if (food.type) return String(food.type).toLowerCase() === "veg";
    const combined = `${food.name || ""} ${food.category || ""} ${food.description || ""}`.toLowerCase();
    return !NON_VEG_PATTERNS.test(combined);
};

export const toFood = (food) => {
    const veg = isVegetarian(food);
    return {
        ...food,
        id: food._id,
        image: catalogImage(food),
        price: Number(food.price),
        restaurantId: food.restaurant?._id || food.restaurant,
        isVeg: veg,
        type: veg ? "veg" : "nonveg"
    };
};

export const toRestaurant = (restaurant) => ({ ...restaurant, id: restaurant._id, image: catalogImage(restaurant) });
export const getFoods = async (restaurantId) => {
    const query = restaurantId ? `?restaurant=${encodeURIComponent(restaurantId)}` : "";
    const { foods } = await apiRequest(`/foods${query}`, {}, "");
    return foods.map(toFood);
};
export const getFood = async (id) => toFood((await apiRequest(`/foods/${id}`, {}, "")).food);
export const getRestaurants = async () => (await apiRequest("/restaurants", {}, "")).restaurants.map(toRestaurant);
export const getRestaurant = async (id) => toRestaurant((await apiRequest(`/restaurants/${id}`, {}, "")).restaurant);

