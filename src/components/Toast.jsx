function Toast({ message, type = "success", onClose }) {

    const styles = {
        success: "bg-green-600 border-green-500",
        error: "bg-red-500 border-red-400",
        warning: "bg-yellow-500 border-yellow-400",
        info: "bg-blue-500 border-blue-400"
    };

    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
        info: "ℹ️"
    };


    return (

        <div className="
            fixed
            top-20
            right-4
            sm:right-6
            z-[9999]
            w-[calc(100%-2rem)]
            sm:w-auto
            sm:min-w-[320px]
            max-w-md
        ">

            <div
                className={`
                    flex
                    items-center
                    gap-3
                    px-5
                    py-4
                    rounded-xl
                    shadow-2xl
                    border
                    text-white
                    font-semibold
                    animate-[slideIn_0.3s_ease-out]
                    ${styles[type] || styles.success}
                `}
            >

                <span className="text-xl">
                    {icons[type] || icons.success}
                </span>


                <p className="
                    flex-1
                    text-sm
                    sm:text-base
                ">
                    {message}
                </p>


                <button
                    onClick={onClose}
                    className="
                        text-white
                        text-xl
                        leading-none
                        opacity-80
                        hover:opacity-100
                    "
                    aria-label="Close notification"
                >
                    ×
                </button>

            </div>

        </div>

    );

}

export default Toast;