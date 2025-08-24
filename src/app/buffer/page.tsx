import BufferedOrders from "@/app/buffer/components/BufferedOrders"
import Header from "@/app/form/components/Header"
import Sidebar from "@/app/form/components/Sidebar"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function Buffer() {
    return (
        <ProtectedRoute>
            <div className="h-screen flex bg-gray-50 overflow-hidden">
                {/* Сайдбар слева */}
                <Sidebar />

                {/* Основной контент */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />

                    {/* Контент с прокруткой */}
                    <div className="flex-1 overflow-y-auto">
                        <BufferedOrders />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}