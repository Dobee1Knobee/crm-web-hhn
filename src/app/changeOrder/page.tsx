// LoginForm.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ ДУБЛИРОВАНИЯ
"use client";
import { DropArea } from "@/app/changeOrder/components/DropArea"
import Header from "@/app/form/components/Header"
import Sidebar from "@/app/form/components/Sidebar"
import StatusPills from "@/app/form/components/StatusPills"
import "@/app/global.css"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useUserByAt } from "@/hooks/useUserByAt"
import { useOrderStore } from "@/stores/orderStore"
import {
    DndContext, DragEndEvent, DragOverlay, DragStartEvent, KeyboardSensor, PointerSensor,
    TouchSensor, useSensor,
    useSensors
} from "@dnd-kit/core"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import ChangeOrderForm from './components/ChangeOrderForm'

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

function ChangeOrderContent() {
    const at = "devapi1";
    const user = useUserByAt("devapi1");
    const searchParams = useSearchParams();
    const leadId = searchParams?.get('leadId');

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
        resetForm,
        currentLeadID,
        getByLeadID,
    } = useOrderStore();

    // Состояние только для drag & drop UI
    const [activeService, setActiveService] = useState<ServiceItem | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // 🎯 Настройка сенсоров для drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Минимальное расстояние для активации drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Небольшая задержка для touch устройств
                tolerance: 5, // Толерантность к движению
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: (event, args) => {
                return {
                    x: 0,
                    y: 0,
                };
            },
        })
    );

    // Устанавливаем пользователя в store при загрузке
    useEffect(() => {
        if (user) {
            setCurrentUser({
                userId: user._id,
                userName: user.name,
                userAt: user.at,
                team: user.team.toString(),
                manager_id: user.manager_id,
                shift: user.working || false
            });
        }
    }, [user, setCurrentUser]);

    // Загружаем данные заказа при наличии leadId
    useEffect(() => {
        if (leadId && leadId !== currentLeadID) {
            console.log('Loading order data for leadId:', leadId);
            getByLeadID(leadId);
        }
    }, [leadId, currentLeadID, getByLeadID]);

    // Обработчик начала перетаскивания
    function handleDragStart(event: DragStartEvent) {
        console.log('🚀 Drag started (changeOrder):', event);
        const service = event.active.data.current?.service as ServiceItem;
        console.log('📦 Service data (changeOrder):', service);
        setActiveService(service);
        setActiveId(event.active.id as string);
    }

    // Обработчик окончания перетаскивания
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        console.log('🏁 Drag ended (changeOrder):', { overId: over?.id, activeService, event });

        setActiveService(null);
        setActiveId(null);

        if (!over) {
            console.log('❌ No drop target (changeOrder)');
            return;
        }

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
        <ProtectedRoute>
            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => console.log('🔄 Drag over (changeOrder):', event)}
                onDragMove={(event) => console.log('📱 Drag move (changeOrder):', event)}
                sensors={sensors}
                autoScroll={false}
            >
                <div className="h-screen flex bg-gray-50 overflow-hidden">
                    <Sidebar />

                    <div className="flex-1 flex flex-col">
                        <Header />
                        <StatusPills  />

                        <div className="flex-1 flex overflow-hidden">
                            {/* Left side - Form */}
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <ChangeOrderForm user={user!} leadId={leadId || undefined} />
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
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </ProtectedRoute>
    );
}

export default function ChangeOrder() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChangeOrderContent />
        </Suspense>
    );
}