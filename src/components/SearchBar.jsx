function SearchBar({ search, setSearch }) {

    return (

        <div className="w-full relative">

            {/* Search Icon */}

            <span
                className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-gray-400
                "
            >
                🔍
            </span>


            {/* Input */}

            <input
                type="text"
                placeholder="Search food..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="
                w-full
                px-11
                py-3
                border
                border-gray-200
                dark:border-gray-700
                rounded-xl
                outline-none
                bg-white
                dark:bg-gray-800
                text-gray-800
                dark:text-white
                placeholder-gray-400
                focus:ring-2
                focus:ring-orange-500
                focus:border-orange-500
                transition
                "
            />


            {/* Clear Button */}

            {search && (

                <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-red-500
                    text-lg
                    "
                >
                    ✕
                </button>

            )}

        </div>

    );

}


export default SearchBar;