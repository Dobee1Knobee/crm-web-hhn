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
        console.log('🏁 Drag ended:', { overId: over?.id });

        setActiveService(null);
        setActiveId(null);

        if (!over) return;

        const service = active.data.current?.service as ServiceItem;
        if (!service) return;

        if (over.id === "drop-area") {
            handleDrop(service);
        } else if (typeof over.id === 'string' && over.id.startsWith('sub-drop-')) {
            const mainItemId = parseFloat(over.id.replace('sub-drop-', ''));
            console.log('🎯 Extracted mainItemId:', mainItemId);
            handleDrop(service, mainItemId);
        }
    }

    // Универсальная функция для обработки drop
    const handleDrop = (service: ServiceItem, targetMainItemId?: number) => {
        // Если это основная зона и элемент не main категории - отклоняем
        if (!targetMainItemId && service.category !== 'main') {
            return;
        }

        // Если это подзона main элемента и элемент main категории - отклоняем
        if (targetMainItemId && service.category === 'main') {
            return;
        }

        addOrUpdateService(service, targetMainItemId);
    };

    // Функция добавления или обновления сервиса
    const addOrUpdateService = (service: ServiceItem, parentMainItemId?: number) => {


        // Логика для main элементов
        if (service.category === 'main' && !parentMainItemId) {
            const newItem: ServiceItem = {
                ...service,
                orderId: Date.now() + Math.random(),
                quantity: 1,
                subItems: []
            };
            setSelected(prev => [...prev, newItem]);
            return;
        }


        // Логика для additional/materials элементов
        if (parentMainItemId && (service.category === 'additional' || service.category === 'materials')) {
            console.log('🔧 Adding to subItems of main:', parentMainItemId);

            // Ищем main элемент
            const mainItem = selected.find(item => item.orderId === parentMainItemId);
            if (!mainItem) {
                console.error('❌ Main item not found:', parentMainItemId);

                return;
            }
            // if (!mainItem) {
            //     console.error('❌ Main item not found:', parentMainItemId);
            //
            //     if (selected.length === 0) {
            //         console.log('📦 Creating default "NO TV" main item');
            //         // Создаем default main элемент
            //         const defaultMainItem: ServiceItem = {
            //             id: "noTV",
            //             name: "NO TV",
            //             price: 0,
            //             category: "main",
            //             orderId: Math.floor(Date.now() + Math.random() * 1000),
            //             quantity: 1,
            //             subItems: []
            //         };
            //
            //         setSelected([defaultMainItem]);
            //
            //         // Теперь добавляем текущий additional элемент к новому main
            //         setTimeout(() => {
            //             addOrUpdateService(service, defaultMainItem.orderId);
            //         }, 0);
            //     }
            //     return;
            // }

            // Проверяем, есть ли уже такой sub-элемент
            const existingSubItem = mainItem.subItems?.find(subItem => subItem.name === service.name);

            if (existingSubItem) {
                console.log('➕ Increasing quantity of existing sub-item');
                // Увеличиваем количество
                setSelected(prev => prev.map(item =>
                    item.orderId === parentMainItemId && item.subItems
                        ? {
                            ...item,
                            subItems: item.subItems.map(subItem =>
                                subItem.orderId === existingSubItem.orderId
                                    ? { ...subItem, quantity: (subItem.quantity || 1) + 1 }
                                    : subItem
                            )
                        }
                        : item
                ));
            } else {
                console.log('✨ Creating new sub-item');
                // Создаем новый sub-элемент
                const newItem: ServiceItem = {
                    ...service,
                    orderId: Date.now() + Math.random(),
                    quantity: 1,
                    parentMainItemId: parentMainItemId
                };

                setSelected(prev => prev.map(item =>
                    item.orderId === parentMainItemId && item.subItems
                        ? { ...item, subItems: [...item.subItems, newItem] }
                        : item
                ));
            }
            return;
        }

        console.log('❓ Unexpected case:', { category: service.category, parentMainItemId });
    };

    // Функция удаления элемента
    const handleRemove = (id: string) => {
        const numericId = parseInt(id);

        // Сначала пытаемся найти среди main элементов
        const mainItem = selected.find(item => item.orderId?.toString() === id || item.id === id);
        if (mainItem) {
            setSelected(prev => prev.filter(item =>
                item.orderId?.toString() !== id && item.id !== id
            ));
            return;
        }

        // Если не нашли среди main, ищем среди subItems
        setSelected(prev => prev.map(item =>
            item.subItems ? {
                ...item,
                subItems: item.subItems.filter(subItem =>
                    subItem.orderId?.toString() !== id && subItem.id !== id
                )
            } : item
        ));
    };

    // Функция обновления количества main элемента
    const handleUpdateQuantity = (orderId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemove(orderId.toString());
            return;
        }

        setSelected(prev => prev.map(item =>
            item.orderId === orderId
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    // Функция обновления цены main элемента
    const handleUpdatePrice = (orderId: number, newPrice: number) => {
        setSelected(prev => prev.map(item =>
            item.orderId === orderId
                ? { ...item, price: newPrice }
                : item
        ));
    };

    // Функция обновления количества подэлемента
    const handleUpdateSubItemQuantity = (mainItemId: number, subItemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveSubItem(mainItemId, subItemId);
            return;
        }

        setSelected(prev => prev.map(item =>
            item.orderId === mainItemId && item.subItems
                ? {
                    ...item,
                    subItems: item.subItems.map(subItem =>
                        subItem.orderId === subItemId
                            ? { ...subItem, quantity: newQuantity }
                            : subItem
                    )
                }
                : item
        ));
    };

    // Функция удаления подэлемента
    const handleRemoveSubItem = (mainItemId: number, subItemId: number) => {
        setSelected(prev => prev.map(item =>
            item.orderId === mainItemId && item.subItems
                ? {
                    ...item,
                    subItems: item.subItems.filter(subItem => subItem.orderId !== subItemId)
                }
                : item
        ));
    };
    const handleUpdateDiagonals = (orderId: number, diagonals: string[]) => {
        setSelected(prev => prev.map(item =>
            item.orderId === orderId
                ? { ...item, diagonals: diagonals }
                : item
        ));
    };

// Функция обновления кастомной цены для NO TV
    const handleUpdateCustomPrice = (orderId: number, customPrice: number) => {
        setSelected(prev => prev.map(item =>
            item.orderId === orderId
                ? { ...item, customPrice: customPrice }
                : item
        ));
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
                                <DropArea
                                    items={selected}
                                    onRemove={handleRemove}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onUpdatePrice={handleUpdatePrice}
                                    onUpdateSubItemQuantity={handleUpdateSubItemQuantity}
                                    onRemoveSubItem={handleRemoveSubItem}
                                    onUpdateDiagonals={handleUpdateDiagonals}           // ← Новый пропс
                                    onUpdateCustomPrice={handleUpdateCustomPrice}       // ← Новый пропс
                                    draggedItem={activeService}
                                    onDrop={handleDrop}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DragOverlay - плавающий слой с максимальным z-index */}
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

                        {/* Эффект "подъема" */}
                        <div className="absolute -inset-1 bg-blue-400 rounded-lg opacity-30 animate-pulse"></div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}