"use client";
import "@/app/global.css";
import { useUserByAt } from "@/hooks/useUserByAt";
import { useOrders } from "@/hooks/useOrders";
import {OrderStatus} from "@/types/api";
import Header from "@/app/form/components/Header";
import StatusPills from "@/app/form/components/StatusPills";
import OrderForm from "@/app/form/components/OrderForm/OrderForm";
import Sidebar from "@/app/form/components/Sidebar";
import {DndContext, DragEndEvent, DragStartEvent, DragOverlay} from "@dnd-kit/core";
import {useState} from "react";
import {DropArea, ServiceItem} from "@/app/form/components/DropArea";

export default function Home() {
    const at = "devapi1"
    const user = useUserByAt("devapi1");
    useOrders({ username: "devapi1" });

    const [selected, setSelected] = useState<ServiceItem[]>([]);
    // Состояние для отслеживания перетаскиваемого элемента
    const [activeService, setActiveService] = useState<ServiceItem | null>(null);
    // ID активного элемента для скрытия оригинала
    const [activeId, setActiveId] = useState<string | null>(null);
    const [leadId, setLeadId] = useState<string | null>(null);

    if (!user) return null;

    // Обработчик начала перетаскивания
    function handleDragStart(event: DragStartEvent) {
        const service = event.active.data.current?.service as ServiceItem;
        setActiveService(service); // Сохраняем перетаскиваемый элемент
        setActiveId(event.active.id as string); // Сохраняем ID для скрытия оригинала
    }

    // Обработчик окончания перетаскивания
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveService(null); // Сбрасываем активный элемент
        setActiveId(null); // Сбрасываем активный ID

        if (!over || over.id !== "drop-area") return;

        const service = active.data.current?.service as ServiceItem;
        if (service) {
            setSelected((prev) => [...prev, { ...service, id: crypto.randomUUID() }]);
        }
    }

    const handleRemove = (id: string) => {
        setSelected(prev => prev.filter(item => item.id !== id));
    };

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex bg-gray-50 overflow-hidden">
                <Sidebar />

                <div className="flex-1 flex flex-col">
                    <Header />
                    <StatusPills />

                    <div className="flex-1 flex overflow-hidden">
                        {/* Left side - Form - скроллируется только содержимое внутри */}
                        <div className="w-1/2 p-6 overflow-y-auto">
                            <OrderForm user={user} />
                        </div>

                        {/* Right side - Drop Area - полностью статична */}
                        <div className="w-1/2 p-6 flex flex-col">
                            <div className="flex-1 min-h-0">
                                <DropArea items={selected} onRemove={handleRemove} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DragOverlay - плавающий слой с максимальным z-index */}
            <DragOverlay style={{ zIndex: 9999 }}>
                {activeService ? (
                    <div className="bg-gray-800 text-white rounded-lg shadow-2xl px-3 py-2 min-h-[58px] flex flex-col justify-center items-center text-xs font-medium transform rotate-2 scale-110 border-2 border-gray-600">
                        <span className="leading-tight font-semibold">{activeService.name}</span>
                        <span className="text-[11px] mt-1 opacity-75">${activeService.price}</span>

                        {/* Эффект "подъема" */}
                        <div className="absolute -inset-1 bg-blue-400 rounded-lg opacity-30 animate-pulse"></div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
