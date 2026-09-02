
import { useEffect } from "react";

function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2500);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <div
            className={`
                fixed
                top-20
                right-5
                z-[9999]
                min-w-[280px]
                max-w-[90vw]
                px-5
                py-4
                rounded-xl
                shadow-2xl
                text-white
                font-semibold
                flex
                items-center
                justify-between
                gap-4
                ${
                    type === "error"
                        ? "bg-red-500"
                        : type === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-600"
                }
            `}
        >
            <div className="flex items-center gap-2">
                <span className="text-lg">
                    {type === "error"
                        ? "❌"
                        : type === "warning"
                        ? "⚠️"
                        : "✅"}
                </span>

                <span>{message}</span>
            </div>

            <button
                type="button"
                onClick={onClose}
                className="
                    text-white
                    text-2xl
                    font-bold
                    leading-none
                    hover:opacity-70
                    transition
                    duration-200
                    cursor-pointer
                "
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}

export default Toast;

