import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

const ToastContext = createContext();


export function ToastProvider({ children }) {

    const [toast, setToast] = useState(null);

    const timerRef = useRef(null);


    // =========================
    // SHOW TOAST
    // =========================

    const showToast = (
        message,
        type = "success"
    ) => {

        // Clear previous timer
        if (timerRef.current) {

            clearTimeout(timerRef.current);

        }


        // Show new toast
        setToast({
            message,
            type
        });


        // Hide after 2.5 seconds
        timerRef.current = setTimeout(() => {

            setToast(null);

        }, 2500);

    };


    // =========================
    // CLEANUP
    // =========================

    useEffect(() => {

        return () => {

            if (timerRef.current) {

                clearTimeout(timerRef.current);

            }

        };

    }, []);


    return (

        <ToastContext.Provider
            value={{
                showToast
            }}
        >

            {children}


            {/* Toast Notification */}

            {toast && (

                <div
                    className={`
                        fixed
                        top-20
                        right-5
                        z-[9999]
                        px-5
                        py-3
                        rounded-xl
                        shadow-xl
                        text-white
                        font-semibold
                        flex
                        items-center
                        gap-2
                        min-w-[220px]
                        max-w-[350px]
                        ${
                            toast.type === "error"
                                ? "bg-red-500"
                                : "bg-green-600"
                        }
                    `}
                >

                    {/* Icon */}

                    <span className="text-lg">

                        {toast.type === "error"
                            ? "❌"
                            : "✅"}

                    </span>


                    {/* Message */}

                    <span>

                        {toast.message}

                    </span>

                </div>

            )}

        </ToastContext.Provider>

    );

}


export function useToast() {

    return useContext(ToastContext);

}