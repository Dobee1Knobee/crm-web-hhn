// DropArea.tsx - ИНТЕГРИРОВАННАЯ ВЕРСИЯ СО STORE
import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useOrderStore } from '@/stores/orderStore';

export interface ServiceItem {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    orderId?: number;
    category: string;
    subItems?: ServiceItem[];
    parentMainItemId?: number;
    diagonals?: string[];
    customPrice?: number;
}

interface DropAreaProps {
    items: ServiceItem[];
    onRemove: (id: string) => void;
    onUpdateQuantity?: (orderId: number, newQuantity: number) => void;
    onUpdatePrice?: (orderId: number, newPrice: number) => void;
    onUpdateSubItemQuantity?: (mainItemId: number, subItemId: number, newQuantity: number) => void;
    onRemoveSubItem?: (mainItemId: number, subItemId: number) => void;
    onUpdateDiagonals?: (orderId: number, diagonals: string[]) => void;
    onUpdateCustomPrice?: (orderId: number, customPrice: number) => void;
    isDragOver?: boolean;
    draggedItem?: any;
    onDrop?: (draggedItem: any, targetMainItemId?: number) => void;
}

// Компонент для ввода диагоналей (без изменений)
const DiagonalInput: React.FC<{
    mainItemId: number;
    diagonals?: string[];
    onUpdateDiagonals?: (orderId: number, diagonals: string[]) => void;
}> = ({ mainItemId, diagonals = [], onUpdateDiagonals }) => {
    const [newDiagonal, setNewDiagonal] = useState('');
    const [showInput, setShowInput] = useState(diagonals.length === 0);

    const addDiagonal = () => {
        if (newDiagonal.trim() && onUpdateDiagonals) {
            const updatedDiagonals = [...diagonals, newDiagonal.trim()];
            onUpdateDiagonals(mainItemId, updatedDiagonals);
            setNewDiagonal('');
            setShowInput(false);
        }
    };

    const removeDiagonal = (index: number) => {
        if (onUpdateDiagonals) {
            const updatedDiagonals = diagonals.filter((_, i) => i !== index);
            onUpdateDiagonals(mainItemId, updatedDiagonals);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addDiagonal();
        } else if (e.key === 'Escape') {
            setNewDiagonal('');
            setShowInput(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-800 flex items-center gap-1">
                    📐 TV Diagonals:
                    {diagonals.length === 0 && (
                        <span className="text-red-500 animate-pulse ml-1">⚠️ Please add TV sizes</span>
                    )}
                </div>
                {!showInput && (
                    <button
                        onClick={() => setShowInput(true)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
                    >
                        + Add Size
                    </button>
                )}
            </div>

            {diagonals.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                    {diagonals.map((diagonal, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                            {diagonal}"
                            <button
                                onClick={() => removeDiagonal(index)}
                                className="hover:text-red-600 ml-1"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {showInput && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newDiagonal}
                        onChange={(e) => setNewDiagonal(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="e.g., 55, 65, 75"
                        className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={addDiagonal}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => {
                            setNewDiagonal('');
                            setShowInput(false);
                        }}
                        className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

// Компонент для ввода кастомной цены (без изменений)
const CustomPriceInput: React.FC<{
    mainItemId: number;
    customPrice?: number;
    onUpdateCustomPrice?: (orderId: number, customPrice: number) => void;
}> = ({ mainItemId, customPrice, onUpdateCustomPrice }) => {
    const [tempPrice, setTempPrice] = useState(customPrice?.toString() || '');
    const [isEditing, setIsEditing] = useState(!customPrice);

    const savePrice = () => {
        const price = parseFloat(tempPrice) || 0;
        if (onUpdateCustomPrice) {
            onUpdateCustomPrice(mainItemId, price);
        }
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            savePrice();
        } else if (e.key === 'Escape') {
            setTempPrice(customPrice?.toString() || '');
            setIsEditing(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-green-800 flex items-center gap-1">
                    💰 Custom Price:
                    {!customPrice && (
                        <span className="text-red-500 animate-pulse ml-1">⚠️ Please set price</span>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <span className="text-green-600 font-bold">$</span>
                        <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={savePrice}
                            placeholder="0.00"
                            className="w-20 px-2 py-1 border border-green-300 rounded text-sm text-center focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            autoFocus
                        />
                        <button
                            onClick={savePrice}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-green-700 font-semibold">
                            ${customPrice?.toFixed(2) || '0.00'}
                        </span>
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setTempPrice(customPrice?.toString() || '');
                            }}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                            Edit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Компонент для подзоны drop (без изменений)
const SubDropZone: React.FC<{
    mainItemId: number;
    subItems?: ServiceItem[];
    draggedItem?: any;
    onUpdateSubItemQuantity?: (mainItemId: number, subItemId: number, newQuantity: number) => void;
    onRemoveSubItem?: (mainItemId: number, subItemId: number) => void;
}> = ({
          mainItemId,
          subItems = [],
          draggedItem,
          onUpdateSubItemQuantity,
          onRemoveSubItem
      }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `sub-drop-${mainItemId}`,
    });

    const canAcceptDrop = draggedItem && ['additional', 'materials'].includes(draggedItem.category);

    return (
        <div
            ref={setNodeRef}
            className={`mt-4 p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
                isOver && canAcceptDrop
                    ? "border-green-400 bg-green-50"
                    : isOver && !canAcceptDrop
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 bg-gray-50"
            }`}
        >
            <div className="text-sm text-gray-600 mb-2 font-medium">
                📎 Additional Services & Materials Drop Zone
            </div>

            {subItems.length > 0 ? (
                <div className="space-y-2">
                    {subItems.map((subItem) => (
                        <div key={subItem.orderId} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">{subItem.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        subItem.category === 'additional' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {subItem.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-600 font-semibold">
                                    ${subItem.price} × {subItem.quantity || 1} = ${(subItem.price * (subItem.quantity || 1)).toFixed(2)}
                                </span>
                                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => onUpdateSubItemQuantity && subItem.orderId && onUpdateSubItemQuantity(mainItemId, subItem.orderId, (subItem.quantity || 1) - 1)}
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                    >
                                        −
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-gray-800">{subItem.quantity || 1}</span>
                                    <button
                                        onClick={() => onUpdateSubItemQuantity && subItem.orderId && onUpdateSubItemQuantity(mainItemId, subItem.orderId, (subItem.quantity || 1) + 1)}
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-600 text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => onRemoveSubItem && subItem.orderId && onRemoveSubItem(mainItemId, subItem.orderId)}
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-400 text-xs hover:bg-red-50 hover:text-red-600 transition-all duration-200 ml-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-2">
                    <div className="text-sm">Drop additional services & materials here</div>
                    {draggedItem && ['additional', 'materials'].includes(draggedItem.category) && (
                        <div className="text-xs text-green-600 font-medium mt-1 animate-pulse">
                            ✨ Ready to accept "{draggedItem.name}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const DropArea: React.FC<DropAreaProps> = ({
                                                      items,
                                                      onRemove,
                                                      onUpdateQuantity,
                                                      onUpdatePrice,
                                                      onUpdateSubItemQuantity,
                                                      onRemoveSubItem,
                                                      onUpdateDiagonals,
                                                      onUpdateCustomPrice,
                                                      isDragOver = false,
                                                      draggedItem = null,
                                                      onDrop
                                                  }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: "drop-area",
    });

    // 🏪 ПОДКЛЮЧЕНИЕ К STORE
    const {
        formData,
        currentUser,
        isWorkingOnTelegramOrder,
        currentTelegramOrder,
        isSaving,
        error,
        createOrder,
        createOrderFromTelegram,
        saveToTeamBuffer,
        validateForm,
        getTotalPrice
    } = useOrderStore();

    const [editingPrice, setEditingPrice] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState('');

    // 📊 Используем данные из store для общей стоимости
    const total = getTotalPrice();

    // 🎯 ОБРАБОТЧИКИ КНОПОК
    const handleSaveOrder = async () => {
        if (!currentUser) {
            alert('Please login to save order');
            return;
        }

        console.log('💾 Saving order...');

        // Показываем текущее состояние для отладки
        console.log('Form data:', formData);
        console.log('Services:', items);
        console.log('Is Telegram order:', isWorkingOnTelegramOrder);

        try {
            let createdOrder;

            if (isWorkingOnTelegramOrder) {
                // Создаем заказ из Telegram данных
                createdOrder = await createOrderFromTelegram();
            } else {
                // Создаем обычный заказ
                createdOrder = await createOrder(currentUser.userAt);
            }

            if (createdOrder) {
                alert(`✅ Order created successfully! Order ID: ${createdOrder.leadId}`);
                console.log('✅ Created order:', createdOrder);
            } else {
                // Показываем ошибки валидации
                const errors = validateForm();
                if (errors.length > 0) {
                    alert(`❌ Please fix the following issues:\n\n${errors.join('\n')}`);
                } else {
                    alert('❌ Failed to create order. Please try again.');
                }
            }
        } catch (err) {
            console.error('❌ Error saving order:', err);
            alert('❌ Error saving order. Please check console for details.');
        }
    };

    const handleSendToBuffer = async () => {
        if (!currentUser) {
            alert('Please login to send to buffer');
            return;
        }

        // Для Telegram заказов не отправляем в буфер
        if (isWorkingOnTelegramOrder) {
            alert('📱 Telegram orders should be saved directly, not sent to buffer');
            return;
        }

        console.log('🚀 Sending to buffer...');

        try {
            await saveToTeamBuffer();
            alert('🚀 Order sent to team buffer successfully!');
            console.log('🚀 Sent to buffer');
        } catch (err) {
            console.error('❌ Error sending to buffer:', err);
            alert('❌ Error sending to buffer. Please check console for details.');
        }
    };

    // 🔍 ОТЛАДКА
    console.log('🔍 DropArea Debug:', {
        draggedItem: draggedItem,
        draggedItemName: draggedItem?.name,
        draggedItemCategory: draggedItem?.category,
        itemsLength: items.length,
        hasMainItems: items.some(item => item.category === 'main'),
        isOver,
        total,
        formDataComplete: !!(formData.customerName && formData.phoneNumber && formData.date && formData.time),
        isWorkingOnTelegramOrder,
        currentUser: currentUser?.userName
    });

    // 🎨 UI ЛОГИКА (без изменений)
    const startPriceEdit = (orderId: number, currentPrice: number) => {
        setEditingPrice(orderId);
        setTempPrice(currentPrice.toString());
    };

    const savePriceEdit = (orderId: number) => {
        const newPrice = parseFloat(tempPrice) || 0;
        if (onUpdatePrice) {
            onUpdatePrice(orderId, newPrice);
        }
        setEditingPrice(null);
        setTempPrice('');
    };

    const handlePriceKeyPress = (e: React.KeyboardEvent, orderId: number) => {
        if (e.key === 'Enter') {
            savePriceEdit(orderId);
        } else if (e.key === 'Escape') {
            setEditingPrice(null);
            setTempPrice('');
        }
    };

    const updateQuantity = (orderId: number, newQuantity: number) => {
        if (onUpdateQuantity) {
            onUpdateQuantity(orderId, newQuantity);
        }
    };

    const canAcceptInMainZone = draggedItem && draggedItem.category === 'main';
    const isAdditionalItem = draggedItem && (draggedItem.category === 'additional' || draggedItem.category === 'materials');
    const hasMainServices = items.length > 0 && items.some(item => item.category === 'main');

    return (
        <div
            ref={setNodeRef}
            className={`w-full h-full rounded-xl border-4 border-dashed p-6 transition-colors duration-300 ${
                isOver
                    ? canAcceptInMainZone
                        ? "border-green-400 bg-green-50"
                        : "border-red-400 bg-red-50"
                    : isAdditionalItem
                        ? "border-red-400 bg-red-100"
                        : "border-blue-200 bg-blue-50"
            }`}
        >
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                    📋 Order Builder
                    {/* 📱 Индикатор Telegram заказа */}
                    {isWorkingOnTelegramOrder && currentTelegramOrder && (
                        <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            📱 Telegram: {currentTelegramOrder.customerName}
                        </span>
                    )}
                </h2>

                {/* ⚠️ Показываем ошибки */}
                {error && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
                        <div className="text-red-600 font-semibold text-sm">
                            ❌ {error}
                        </div>
                    </div>
                )}

                {/* Логика предупреждений (без изменений) */}
                {isAdditionalItem ? (
                    hasMainServices ? (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
                            <div className="text-red-600 font-semibold text-sm mb-1">
                                ⚠️ Additional services must be dropped on main services
                            </div>
                            <div className="text-red-500 text-xs">
                                Drop "{draggedItem.name}" directly onto a main service card below, not in this zone
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-3">
                            <div className="text-red-600 font-semibold text-sm mb-1">
                                ⚠️ Please add main service first
                            </div>
                            <div className="text-red-500 text-xs">
                                Additional services like "{draggedItem.name}" must be added to main services. Drop main service here first.
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-sm text-blue-600 font-medium mb-2">
                        Main drag zone - drag main services here
                    </div>
                )}

                {draggedItem && !isAdditionalItem && (
                    <div className={`font-semibold animate-pulse text-sm ${
                        canAcceptInMainZone ? 'text-green-600' : 'text-red-500'
                    }`}>
                        {canAcceptInMainZone
                            ? `✨ Drop "${draggedItem.name}" here!`
                            : `❌ Only main services can be dropped here`
                        }
                    </div>
                )}
            </div>

            {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <div className="text-8xl mb-6 opacity-50">📋</div>
                        <div className="text-xl font-medium text-gray-500 italic">
                            Your order is empty. Start by dragging main services or additional items.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto pr-2">
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li
                                    key={item.orderId || item.id}
                                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* Main Item */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.name}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    item.category === 'main' ? 'bg-red-100 text-red-600' :
                                                        item.category === 'additional' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {item.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mt-2">
                                                {editingPrice === item.orderId ? (
                                                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-lg">
                                                        <span className="text-green-600 font-bold">$</span>
                                                        <input
                                                            type="number"
                                                            value={tempPrice}
                                                            onChange={(e) => setTempPrice(e.target.value)}
                                                            onKeyDown={(e) => handlePriceKeyPress(e, item.orderId!)}
                                                            onBlur={() => savePriceEdit(item.orderId!)}
                                                            className="w-20 px-2 py-1 border-2 border-green-300 rounded-lg text-green-700 font-bold text-center focus:border-green-500"
                                                            autoFocus
                                                        />
                                                        <span className="text-green-600">× {item.quantity || 1}</span>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-green-600 font-semibold cursor-pointer hover:bg-green-50 px-2 py-1 rounded"
                                                        onClick={() => item.orderId && startPriceEdit(item.orderId, item.name === "NO TV" && item.customPrice !== undefined ? item.customPrice : item.price)}
                                                    >
                                                        ${(item.name === "NO TV" && item.customPrice !== undefined ? item.customPrice : item.price)} × {item.quantity || 1} = ${((item.name === "NO TV" && item.customPrice !== undefined ? item.customPrice : item.price) * (item.quantity || 1)).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() => item.orderId && updateQuantity(item.orderId, (item.quantity || 1) - 1)}
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center font-bold text-gray-800">{item.quantity || 1}</span>
                                                <button
                                                    onClick={() => item.orderId && updateQuantity(item.orderId, (item.quantity || 1) + 1)}
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => onRemove(item.orderId?.toString() || item.id)}
                                                className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors duration-200"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    {item.category === 'main' && item.name !== "NO TV" && (
                                        <DiagonalInput
                                            mainItemId={item.orderId!}
                                            diagonals={item.diagonals}
                                            onUpdateDiagonals={onUpdateDiagonals}
                                        />
                                    )}

                                    {item.category === 'main' && item.name === "NO TV" && (
                                        <CustomPriceInput
                                            mainItemId={item.orderId!}
                                            customPrice={item.customPrice}
                                            onUpdateCustomPrice={onUpdateCustomPrice}
                                        />
                                    )}

                                    {item.category === 'main' && (
                                        <SubDropZone
                                            mainItemId={item.orderId!}
                                            subItems={item.subItems}
                                            draggedItem={draggedItem}
                                            onUpdateSubItemQuantity={onUpdateSubItemQuantity}
                                            onRemoveSubItem={onRemoveSubItem}
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* 🚀 НОВЫЕ КНОПКИ С ФУНКЦИОНАЛЬНОСТЬЮ */}
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold">
                                Total: ${total.toFixed(2)}
                            </div>

                            {/* 📊 Статус заказа */}
                            <div className="text-sm mt-1 opacity-90">
                                {isWorkingOnTelegramOrder ? (
                                    `📱 Telegram Order: ${currentTelegramOrder?.customerName}`
                                ) : (
                                    `🏠 New Order: ${formData.customerName || 'Unnamed Customer'}`
                                )}
                            </div>

                            <div className="flex w-full justify-between gap-3 mt-4">
                                <button
                                    onClick={handleSaveOrder}
                                    disabled={isSaving || items.length === 0}
                                    className={`flex items-center justify-center gap-2 w-1/2 py-4 rounded-2xl border shadow transition-all ${
                                        isSaving || items.length === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
                                            : 'bg-white text-black border-gray-300 hover:shadow-md hover:bg-gray-50'
                                    }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            💾 <span>{isWorkingOnTelegramOrder ? 'Complete Telegram Order' : 'Save Order'}</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSendToBuffer}
                                    disabled={isSaving || items.length === 0 || isWorkingOnTelegramOrder}
                                    className={`flex items-center justify-center gap-2 w-1/2 py-4 rounded-2xl shadow transition-all ${
                                        isSaving || items.length === 0 || isWorkingOnTelegramOrder
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-orange-400 text-white hover:bg-orange-500'
                                    }`}
                                    title={isWorkingOnTelegramOrder ? 'Telegram orders are saved directly' : 'Send to team buffer'}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            🚀 <span>Send to Buffer</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 📝 Подсказки для пользователя */}
                            <div className="mt-3 text-xs opacity-80">
                                {isWorkingOnTelegramOrder ? (
                                    <div className="flex items-center justify-center gap-1">
                                        <span>📱</span>
                                        <span>Complete this Telegram order to create final order</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <span>💾</span>
                                            <span>Save = Create final order</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>🚀</span>
                                            <span>Buffer = Share with team</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};