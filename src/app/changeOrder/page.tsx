// LoginForm.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ДУБЛИРОВАНИЯ
"use client";
import "@/app/global.css";
import { useUserByAt } from "@/hooks/useUserByAt";
import { OrderStatus } from "@/types/api";
import Header from "@/app/form/components/Header";
import StatusPills from "@/app/form/components/StatusPills";
import OrderForm from "@/app/form/components/OrderForm/OrderForm";
import Sidebar from "@/app/form/components/Sidebar";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { useState, useEffect } from "react";
import { DropArea } from "@/app/changeOrder/components/DropArea";
import { useOrderStore } from "@/stores/orderStore";

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

export default function ChangeOrder() {
    const at = "devapi1";
    const user = useUserByAt("devapi1");

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
        getTotalPrice,
        setCurrentUser,
        formData,
        isWorkingOnTelegramOrder
    } = useOrderStore();

    // Состояние только для drag & drop UI
    const [activeService, setActiveService] = useState<ServiceItem | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Устанавливаем пользователя в store при загрузке


    if (!user) return null;

    // Обработчик начала перетаскивания
    function handleDragStart(event: DragStartEvent) {
        const service = event.active.data.current?.service as ServiceItem;
        setActiveService(service);
        setActiveId(event.active.id as string);
    }

    // Обработчик окончания перетаскивания
    function handleDragEnd(event: DragEndEvent) {
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
            const mainItemId = parseInt(over.id.replace('sub-drop-', ''));
            console.log('🎯 Adding sub service to main item:', mainItemId, service.name);

            if (service.category === 'additional' || service.category === 'materials') {
                addService(service, mainItemId);
            } else {
                console.log('❌ Cannot add main service to sub area');
            }
        }
    }

    // 🚀 Debug компонент для отслеживания store

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex bg-gray-50 overflow-hidden">
                <Sidebar />

                <div className="flex-1 flex flex-col">
                    <Header />
                    <StatusPills  />

                    <div className="flex-1 flex overflow-hidden">
                        {/* Left side - Form */}
                        <div className="w-1/2 p-6 overflow-y-auto">
                            <OrderForm user={user} />
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
                                    onDrop={() => {}} // Не используется, логика в handleDragEnd
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Debug Panel - только в development */}

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
                        <div className="absolute -inset-1 bg-blue-400 rounded-lg opacity-30 animate-pulse"></div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}