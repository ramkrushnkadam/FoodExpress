import { apiRequest } from "./api";
import { catalogImage } from "./catalogImages";
export const toFood = (food) => ({ ...food, id: food._id, image: catalogImage(food), price: Number(food.price), restaurantId: food.restaurant?._id || food.restaurant });
export const toRestaurant = (restaurant) => ({ ...restaurant, id: restaurant._id, image: catalogImage(restaurant) });
export const getFoods = async (restaurantId) => { const query = restaurantId ? `?restaurant=${encodeURIComponent(restaurantId)}` : ""; const { foods } = await apiRequest(`/foods${query}`, {}, ""); return foods.map(toFood); };
export const getFood = async (id) => toFood((await apiRequest(`/foods/${id}`, {}, "")).food);
export const getRestaurants = async () => (await apiRequest("/restaurants", {}, "")).restaurants.map(toRestaurant);
export const getRestaurant = async (id) => toRestaurant((await apiRequest(`/restaurants/${id}`, {}, "")).restaurant);
