import { useOrderStore } from "@/stores/orderStore";
import {Trash2} from "lucide-react";

export default function ButtonResetForm() {
    const { resetForm } = useOrderStore();

    const handleClick = () => {
        if (confirm('Reset form? All data will be lost.')) {
            resetForm();
        }
    };

    return (
        <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
            <Trash2 className="w-4 h-4" />

             Reset Form
        </button>
    );
}
