"use client"
import Header from "@/app/form/components/Header"
import Sidebar from "@/app/form/components/Sidebar"
import OrdersDemo from "@/app/myOrders/components/CurrentOrders"
import StatisticBar from "@/app/myOrders/components/StatisticBar"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function MyOrders() {
    return (
        <ProtectedRoute>
            <div className="h-screen flex bg-gray-50 overflow-hidden">
                {/* Sidebar - фиксированная слева */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Header - фиксированный сверху */}
                    <Header />

                    {/* Content - скроллируемая область */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* Statistics Bar */}
                            <StatisticBar />
                   
                            <OrdersDemo/>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}