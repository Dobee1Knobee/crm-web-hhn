export default function DateAndTime() {

    return (
        <div className={"bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl"}>
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-violet-500 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Date and Time</h2>
            </div>
            <div className="flex items-center mb-4 gap-4">
                <input
                    type="date" className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none  focus:ring-violet-400 transition focus:ring duration-300 ease-in-out"
                />
                <input type={"text"} placeholder={"1PM"} className={"w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-violet-400 transition focus:ring duration-300 ease-in-out "}/>
            </div>
        </div>
    )
}