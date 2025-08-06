import Header from "@/app/form/components/Header";
import Sidebar from "@/app/form/components/Sidebar";
import StatisticBuffer from "@/app/buffer/components/StaticBuffer";
import BufferedOrders from "@/app/buffer/components/BufferedOrders";

export default function Buffer() {
    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {/* Сайдбар слева */}
            <Sidebar />

            {/* Основной контент */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                {/* Контент с прокруткой */}
                <div className="flex-1 overflow-y-auto">
                    <StatisticBuffer />
                    <BufferedOrders />
                </div>
            </div>
        </div>
    );
}