import { useOrderStore } from "@/stores/orderStore";

export default function DateAndTime() {
    const { formData, updateFormData } = useOrderStore();

    // Обработчик изменения времени с ограничением в 5 символов
    const handleTimeChange = (value: string) => {
        // Ограничиваем до 5 символов
        if (value.length <= 5) {
            updateFormData("time", value);
        }
    };

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-violet-500 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Date and Time</h2>
            </div>

            <div className="flex items-center mb-4 gap-4">
                <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-violet-400 transition"
                    value={formData.date || ""}
                    onChange={(e) => updateFormData("date", e.target.value)}
                />

                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="1PM"
                        className="w-full px-4 py-3 pr-12 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-violet-400 transition"
                        value={formData.time || ""}
                        onChange={(e) => handleTimeChange(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                        {(formData.time || "").length}/5
                    </div>
                </div>
            </div>
        </div>
    );
}