import Header from "@/app/form/components/Header";
import Sidebar from "@/app/form/components/Sidebar";
import StatisticBuffer from "@/app/buffer/components/StaticBuffer";

export default function Buffer() {
    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden">
            {/* Сайдбар слева */}
            <Sidebar />

            {/* Основной контент */}
            <div className="flex-1 flex flex-col">
                <Header />
                {/* Можно добавить остальной контент страницы */}
                <StatisticBuffer/>
            </div>
        </div>
    );
}
