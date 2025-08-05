export default function CustomerInfo() {
    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-blue-600 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>

            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Phone number"
                    name="phone_fake"
                    autoComplete="aaaa"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400"
                />

                <input
                    type="text"
                    placeholder="Customer Name"
                    autoComplete="aaaa"

                    className="w-full px-4 py-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 focus:outline-none  transition focus:ring duration-300 ease-in-out focus:ring-blue-400"
                />
                <input
                    type="text"
                    placeholder="Address, ZIP code"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 focus:outline-none  transition focus:ring duration-300 ease-in-out focus:ring-blue-400"
                    autoComplete="aaaa"

                />
            </div>
        </div>
    );
}
