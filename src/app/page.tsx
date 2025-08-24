// LoginForm.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ДУБЛИРОВАНИЯ И ОШИБОК ESLINT
"use client";
import { DropArea } from "@/app/form/components/DropArea";
import Header from "@/app/form/components/Header";
import OrderForm from "@/app/form/components/OrderForm/OrderForm";
import Sidebar from "@/app/form/components/Sidebar";
import StatusPills from "@/app/form/components/StatusPills";
import "@/app/global.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUserByAt } from "@/hooks/useUserByAt";
import { useOrderStore } from "@/stores/orderStore";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";

// Временный тип для совместимости с существующим DropArea
interface ServiceItem {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    orderId?: number;
    category: 'main' | 'additional' | 'materials';
    subItems?: ServiceItem[];
    parentMainItemId?: number;
    diagonals?: string[];
    customPrice?: number;
}

export default function Home() {
    // Константа at объявлена, но не используется - можно удалить или использовать
    // const at = "devapi1";
    const user = useUserByAt("devapi1");
    // useOrders({ username: "devapi1" });

    // 🏪 Используем ТОЛЬКО store, убираем локальное состояние
    const {
        selectedServices,
        addService,
        removeService,
        updateServiceQuantity,
        updateServicePrice,
        updateServiceDiagonals,
        updateServiceCustomPrice,
        updateSubServiceQuantity,
        removeSubService,
        setCurrentUser,
    } = useOrderStore();

    // Состояние только для drag & drop UI
    const [activeService, setActiveService] = useState<ServiceItem | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);



    // Обработчик начала перетаскивания
    const handleDragStart = (event: DragStartEvent) => {
        const service = event.active.data.current?.service as ServiceItem;
        setActiveService(service);
        setActiveId(event.active.id as string);
    };

    // Обработчик окончания перетаскивания
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        console.log('🏁 Drag ended:', { overId: over?.id, activeService });

        setActiveService(null);
        setActiveId(null);

        if (!over) return;

        const service = active.data.current?.service as ServiceItem;
        if (!service) return;

        // 🎯 Логика drop зон
        if (over.id === "drop-area") {
            // Основная зона - только main услуги
            if (service.category === 'main') {
                console.log('🎯 Adding main service to store:', service.name);
                addService(service);
            } else {
                console.log('❌ Cannot add non-main service to main area');
            }
        } else if (typeof over.id === 'string' && over.id.startsWith('sub-drop-')) {
            // Подзона - additional и materials
            const mainItemId = parseInt(over.id.replace('sub-drop-', ''), 10);
            console.log('🎯 Adding sub service to main item:', mainItemId, service.name);

            if (service.category === 'additional' || service.category === 'materials') {
                addService(service, mainItemId);
            } else {
                console.log('❌ Cannot add main service to sub area');
            }
        }
    };

    // Пустая функция для onDrop (не используется, логика в handleDragEnd)
    const handleDrop = () => {
        // Intentionally empty - logic is handled in handleDragEnd
    };

    return (
        <ProtectedRoute>
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
                            {/* Left side - Form */}
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <OrderForm user={user!} />
                            </div>

                            {/* Right side - Drop Area */}
                            <div className="w-1/2 p-6 flex flex-col">
                                <div className="flex-1 min-h-0">
                                    <DropArea
                                        items={selectedServices} // 🏪 Используем данные из store
                                        onRemove={(id) => removeService(id)}
                                        onUpdateQuantity={(orderId, quantity) => updateServiceQuantity(orderId, quantity)}
                                        onUpdatePrice={(orderId, price) => updateServicePrice(orderId, price)}
                                        onUpdateSubItemQuantity={(mainId, subId, quantity) => updateSubServiceQuantity(mainId, subId, quantity)}
                                        onRemoveSubItem={(mainId, subId) => removeSubService(mainId, subId)}
                                        onUpdateDiagonals={(orderId, diagonals) => updateServiceDiagonals(orderId, diagonals)}
                                        onUpdateCustomPrice={(orderId, price) => updateServiceCustomPrice(orderId, price)}
                                        draggedItem={activeService}
                                        onDrop={handleDrop}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DragOverlay */}
                <DragOverlay style={{ zIndex: 9999 }}>
                    {activeService ? (
                        <div className={`
                            text-white rounded-lg shadow-2xl px-3 py-2 min-h-[58px] 
                            flex flex-col justify-center items-center text-xs font-medium 
                            transform rotate-2 scale-110 border-2
                            ${activeService.category === 'main' ? 'bg-red-800 border-red-600' :
                            activeService.category === 'additional' ? 'bg-orange-800 border-orange-600' :
                                'bg-yellow-800 border-yellow-600'
                        }
                        `}>
                            <span className="leading-tight font-semibold">{activeService.name}</span>
                            <span className="text-[11px] mt-1 opacity-75">${activeService.price}</span>
                            <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ${
                                activeService.category === 'main' ? 'bg-red-600' :
                                activeService.category === 'additional' ? 'bg-orange-600' :
                                    'bg-yellow-600'
                            }`}>
                                {activeService.category}
                            </span>
                            <div className="absolute -inset-1 bg-blue-400 rounded-lg opacity-30 animate-pulse" />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </ProtectedRoute>
    );
}
