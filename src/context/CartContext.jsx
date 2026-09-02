import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const CartContext = createContext();

const CART_STORAGE_KEY = "foodexpress_cart";

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Save cart to localStorage on changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch {}
    }, [cart]);

    // Convert price such as "₹299" or 299 into Number
    const getPrice = (price) => {
        if (typeof price === "number") {
            return price;
        }
        return parseInt(String(price).replace(/[₹,]/g, ""), 10) || 0;
    };

    // Add food to cart
    const addToCart = (food) => {
        setCart((prevCart) => {
            const foodId = food.id || food._id;
            const existingItem = prevCart.find((item) => (item.id || item._id) === foodId);

            if (existingItem) {
                return prevCart.map((item) =>
                    (item.id || item._id) === foodId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prevCart,
                {
                    ...food,
                    id: foodId,
                    price: getPrice(food.price),
                    quantity: 1
                }
            ];
        });
    };

    // Increase quantity
    const increaseQuantity = (id) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                (item.id || item._id) === id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    // Decrease quantity
    const decreaseQuantity = (id) => {
        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    (item.id || item._id) === id
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    // Remove completely
    const removeFromCart = (id) => {
        setCart((prevCart) => prevCart.filter((item) => (item.id || item._id) !== id));
    };

    // Clear entire cart
    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    };

    // Total price
    const totalPrice = cart.reduce((total, item) => {
        const price = getPrice(item.price);
        return total + price * item.quantity;
    }, 0);

    // Total number of items
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    // cartCount is an alias for totalItems to support both naming conventions
    const cartCount = totalItems;

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                increaseQuantity,
                decreaseQuantity,
                removeFromCart,
                clearCart,
                totalPrice,
                totalItems,
                cartCount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}