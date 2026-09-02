import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {

    const [darkMode, setDarkMode] = useState(() => {

        const savedTheme = sessionStorage.getItem("darkMode");

        return savedTheme === "true";

    });


    useEffect(() => {

        document.documentElement.classList.toggle(
            "dark",
            darkMode
        );

        sessionStorage.setItem(
            "darkMode",
            darkMode
        );

    }, [darkMode]);


    const toggleTheme = () => {

        setDarkMode(prev => !prev);

    };


    return (

        <ThemeContext.Provider
            value={{
                darkMode,
                toggleTheme
            }}
        >

            {children}

        </ThemeContext.Provider>

    );

}


export function useTheme() {

    return useContext(ThemeContext);

}