// DropArea.tsx — адаптивные размеры + total не выходит за рамки
"use client";
import ErrorDisplay from "@/components/ErrorDisplay"
import { useOrderStore } from "@/stores/orderStore"
import { useDroppable } from "@dnd-kit/core"
import {
    AlertTriangle,
    Check,
    ClipboardList,
    DollarSign,
    Edit3,
    Loader2,
    Minus,
    Paperclip,
    Plus,
    Save,
    Trash2,
    Tv,
    X,
    XCircle
} from 'lucide-react'
import React, { useState } from "react"

export interface ServiceItem {
    id: string;
    name: string;
    value?: string;
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

/* ---------- вспомогательные подкомпоненты ---------- */

const DiagonalInput: React.FC<{
    mainItemId: number;
    diagonals?: string[];
    onUpdateDiagonals?: (orderId: number, diagonals: string[]) => void;
}> = ({ mainItemId, diagonals = [], onUpdateDiagonals }) => {
    const [newDiagonal, setNewDiagonal] = useState("");
    const [showInput, setShowInput] = useState(diagonals.length === 0);

    const addDiagonal = () => {
        if (newDiagonal.trim() && onUpdateDiagonals) {
            const updated = [...diagonals, newDiagonal.trim()];
            onUpdateDiagonals(mainItemId, updated);
            setNewDiagonal("");
            setShowInput(false);
        }
    };

    const removeDiagonal = (index: number) => {
        if (onUpdateDiagonals) {
            const updated = diagonals.filter((_, i) => i !== index);
            onUpdateDiagonals(mainItemId, updated);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") addDiagonal();
        else if (e.key === "Escape") {
            setNewDiagonal("");
            setShowInput(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    TV Diagonals:
                    {diagonals.length === 0 && (
                        <span className="text-red-500 ml-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Please add TV sizes
                        </span>
                    )}
                </div>
                {!showInput && (
                    <button
                        onClick={() => setShowInput(true)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        Add Size
                    </button>
                )}
            </div>

            {diagonals.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-2">
                    {diagonals.map((d, i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                            {d}"
                            <button onClick={() => removeDiagonal(i)} className="hover:text-red-600 ml-1">
                                <X className="w-3 h-3" />
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
                        className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        autoFocus
                    />
                    <button
                        onClick={addDiagonal}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-1"
                    >
                        <Check className="w-3 h-3" />
                        Add
                    </button>
                    <button
                        onClick={() => {
                            setNewDiagonal("");
                            setShowInput(false);
                        }}
                        className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 flex items-center gap-1"
                    >
                        <XCircle className="w-3 h-3" />
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

const CustomPriceInput: React.FC<{
    mainItemId: number;
    customPrice?: number;
    onUpdateCustomPrice?: (orderId: number, customPrice: number) => void;
}> = ({ mainItemId, customPrice, onUpdateCustomPrice }) => {
    const [tempPrice, setTempPrice] = useState(customPrice?.toString() || "");
    const [isEditing, setIsEditing] = useState(!customPrice);

    const savePrice = () => {
        const price = parseFloat(tempPrice) || 0;
        onUpdateCustomPrice?.(mainItemId, price);
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") savePrice();
        else if (e.key === "Escape") {
            setTempPrice(customPrice?.toString() || "");
            setIsEditing(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Custom Price:
                    {!customPrice && (
                        <span className="text-red-500 ml-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Please set price
                        </span>
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
                            className="w-20 px-2 py-1 border-2 border-green-300 rounded-lg text-center focus:border-green-500"
                            autoFocus
                        />
                        <button
                            onClick={savePrice}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" />
                            Save
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-green-700 font-semibold">
                            ${customPrice?.toFixed(2) || "0.00"}
                        </span>
                        <button
                            onClick={() => {
                                setIsEditing(true);
                                setTempPrice(customPrice?.toString() || "");
                            }}
                            className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                        >
                            <Edit3 className="w-3 h-3" />
                            Edit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const SubDropZone: React.FC<{
    mainItemId: number;
    subItems?: ServiceItem[];
    draggedItem?: any;
    onUpdateSubItemQuantity?: (mainItemId: number, subItemId: number, newQuantity: number) => void;
    onRemoveSubItem?: (mainItemId: number, subItemId: number) => void;
}> = ({ mainItemId, subItems = [], draggedItem, onUpdateSubItemQuantity, onRemoveSubItem }) => {
    const { isOver, setNodeRef } = useDroppable({ id: `sub-drop-${mainItemId}` });
    const canAcceptDrop = draggedItem && ["additional", "materials"].includes(draggedItem.category);

    return (
        <div
            ref={setNodeRef}
            className={`mt-4 p-3 border-2 border-dashed rounded-lg transition-all ${
                isOver && canAcceptDrop
                    ? "border-green-400 bg-green-50"
                    : isOver && !canAcceptDrop
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 bg-gray-50"
            }`}
        >
            <div className="text-sm text-gray-600 mb-2 font-medium flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Additional Services & Materials Drop Zone
            </div>

            {subItems.length > 0 ? (
                <div className="space-y-2">
                    {subItems.map((s) => (
                        <div
                            key={s.orderId}
                            className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">{s.name}</span>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${
                                            s.category === "additional"
                                                ? "bg-orange-100 text-orange-600"
                                                : "bg-yellow-100 text-yellow-600"
                                        }`}
                                    >
                                        {s.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-blue-600 font-semibold">
                                    ${s.price} × {s.quantity || 1} = {(s.price * (s.quantity || 1)).toFixed(2)}
                                </span>
                                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() =>
                                            onUpdateSubItemQuantity &&
                                            s.orderId &&
                                            onUpdateSubItemQuantity(
                                                mainItemId,
                                                s.orderId,
                                                (s.quantity || 1) - 1
                                            )
                                        }
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-gray-800">
                                        {s.quantity || 1}
                                    </span>
                                    <button
                                        onClick={() =>
                                            onUpdateSubItemQuantity &&
                                            s.orderId &&
                                            onUpdateSubItemQuantity(
                                                mainItemId,
                                                s.orderId,
                                                (s.quantity || 1) + 1
                                            )
                                        }
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            onRemoveSubItem && s.orderId && onRemoveSubItem(mainItemId, s.orderId)
                                        }
                                        className="w-6 h-6 bg-white rounded-md shadow-sm text-gray-400 hover:bg-red-50 hover:text-red-600 ml-1 flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-2">
                    <div className="text-sm">Drop additional services & materials here</div>
                    {draggedItem && ["additional", "materials"].includes(draggedItem.category) && (
                        <div className="text-xs text-green-600 font-medium mt-1 flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" />
                            Ready to accept "{draggedItem.name}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/* ----------------------------------- сам DropArea ----------------------------------- */

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
                                                      onDrop,
                                                  }) => {
    const { isOver, setNodeRef } = useDroppable({ id: "drop-area" });

    const {
        formData,
        currentUser,
        isSaving,
        error,
        createOrder,
        validateForm,
        getTotalPrice,
        currentLeadID
    } = useOrderStore();

    const [editingPrice, setEditingPrice] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState("");
    const [isAddingCustomPrice, setIsAddingCustomPrice] = useState(false);
    const [customTotalPrice, setCustomTotalPrice] = useState("");

    const total = getTotalPrice();

    // Функция для получения расчетной цены (без учета кастомной)
    const getCalculatedPrice = () => {
        return items.reduce((total, service) => {
            const servicePrice = (service.name === "NO TV" || service.name === "Custom" || service.value === "noTV" || service.value === "custom") && service.customPrice !== undefined
                ? service.customPrice
                : service.price;
            const serviceTotal = servicePrice * (service.quantity || 1);

            const subItemsTotal = service.subItems ?
                service.subItems.reduce((subSum: number, subItem: ServiceItem) => {
                    const subItemPrice = (subItem.name === "NO TV" || subItem.name === "Custom" || subItem.value === "noTV" || subItem.value === "custom") && subItem.customPrice !== undefined
                        ? subItem.customPrice
                        : subItem.price;
                        return (subSum + (subItemPrice * (subItem.quantity || 1))) * (service.quantity || 1);
                }, 0
                ) : 0;

            return total + serviceTotal + subItemsTotal;
        }, 0);
    };

    const calculatedPrice = getCalculatedPrice();

    const saveCustomTotalPrice = () => {
        const newPrice = parseFloat(customTotalPrice);
        if (!isNaN(newPrice) && newPrice >= 0) {
            useOrderStore.getState().patchFormData({ custom: newPrice });
            setIsAddingCustomPrice(false);
            setCustomTotalPrice("");
        }
    };

    const handleCustomPriceKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            saveCustomTotalPrice();
        } else if (e.key === "Escape") {
            setIsAddingCustomPrice(false);
            setCustomTotalPrice("");
        }
    };

    const resetCustomPrice = () => {
        useOrderStore.getState().patchFormData({ custom: undefined });
        setIsAddingCustomPrice(false);
        setCustomTotalPrice("");
    };

    const startPriceEdit = (orderId: number, currentPrice: number) => {
        setEditingPrice(orderId);
        setTempPrice(currentPrice.toString());
    };
    const savePriceEdit = (orderId: number) => {
        const newPrice = parseFloat(tempPrice) || 0;
        onUpdatePrice?.(orderId, newPrice);
        setEditingPrice(null);
        setTempPrice("");
    };
    const handlePriceKeyPress = (e: React.KeyboardEvent, orderId: number) => {
        if (e.key === "Enter") savePriceEdit(orderId);
        else if (e.key === "Escape") {
            setEditingPrice(null);
            setTempPrice("");
        }
    };
    const updateQuantity = (orderId: number, newQuantity: number) => {
        onUpdateQuantity?.(orderId, newQuantity);
    };

    const canAcceptInMainZone = draggedItem && draggedItem.category === "main";
    const isAdditionalItem =
        draggedItem && (draggedItem.category === "additional" || draggedItem.category === "materials");
    const hasMainServices = items.length > 0 && items.some((i) => i.category === "main");

    return (
        <div
            ref={setNodeRef}
            className={`w-full h-full rounded-xl border-4 border-dashed transition-colors overflow-hidden flex flex-col
        ${isOver ? (canAcceptInMainZone ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50")
                : isAdditionalItem ? "border-red-400 bg-red-100" : "border-blue-200 bg-blue-50"}`}
        >
            {/* Внутренний контейнер с паддингом */}
            <div className="flex flex-col h-full p-3 sm:p-4 lg:p-6">
                {/* Верхняя часть - заголовок */}
                <div className="text-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                        <ClipboardList className="w-6 h-6" />
                        Order Builder

                    </h2>

                    {error && (
                        <ErrorDisplay 
                            error={error} 
                            variant="error" 
                            className="mb-3"
                        />
                    )}

                    {isAdditionalItem ? (
                        hasMainServices ? (
                            <ErrorDisplay 
                                error={`Additional services must be dropped on main services. Drop "${draggedItem.name}" directly onto a main service card below, not in this zone.`}
                                variant="warning"
                                className="mb-3"
                            />
                        ) : (
                            <ErrorDisplay 
                                error={`Please add main service first. Additional services like "${draggedItem?.name}" must be added to main services. Drop main service here first.`}
                                variant="warning"
                                className="mb-3"
                            />
                        )
                    ) : (
                        <div className="text-sm text-blue-600 font-medium mb-2">Main drag zone - drag main services here</div>
                    )}
                </div>

                {/* Средняя часть - прокручиваемый список */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
                    {items.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center text-gray-400">
                            <div>
                                <ClipboardList className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-50" />
                                <div className="text-base sm:text-lg font-medium text-gray-500 italic">
                                    Your order is empty. Start by dragging main services or additional items.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li
                                    key={item.orderId || item.id}
                                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{item.name}</span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded-full ${
                                                        item.category === "main"
                                                            ? "bg-red-100 text-red-600"
                                                            : item.category === "additional"
                                                                ? "bg-orange-100 text-orange-600"
                                                                : "bg-yellow-100 text-yellow-600"
                                                    }`}
                                                >
                                                    {item.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const servicePrice = (item.name === "NO TV" || item.name === "Custom" || item.value === "noTV" || item.value === "custom") && item.customPrice !== undefined ? item.customPrice : item.price;
                                                        return (
                                                            <span className="text-green-600 font-semibold">
                                                                ${servicePrice} × {item.quantity || 1} = ${(servicePrice * (item.quantity || 1)).toFixed(2)}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() =>
                                                        item.orderId && onUpdateQuantity?.(item.orderId, (item.quantity || 1) - 1)
                                                    }
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-gray-800">
                                                    {item.quantity || 1}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        item.orderId && onUpdateQuantity?.(item.orderId, (item.quantity || 1) + 1)
                                                    }
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => onRemove(item.orderId?.toString() || item.id)}
                                                className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 flex items-center gap-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {item.category === "main" && item.name !== "NO TV" && item.value !== "noTV" && (
                                        <DiagonalInput
                                            mainItemId={item.orderId!}
                                            diagonals={item.diagonals}
                                            onUpdateDiagonals={onUpdateDiagonals}
                                        />
                                    )}
                                    {item.category === "main" && (item.name === "NO TV" || item.name === "Custom" || item.value === "noTV" || item.value === "custom") && (
                                        <CustomPriceInput
                                            mainItemId={item.orderId!}
                                            customPrice={item.customPrice}
                                            onUpdateCustomPrice={onUpdateCustomPrice}
                                        />
                                    )}
                                    {item.category === "main" && (
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
                    )}
                </div>

                {/* Нижняя часть - Total и кнопки */}
                <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl text-center">
                        {isAddingCustomPrice ? (
                            <div className="flex items-center justify-center gap-2">
                                <input
                                    type="number"
                                    value={customTotalPrice}
                                    onChange={(e) => setCustomTotalPrice(e.target.value)}
                                    onKeyPress={handleCustomPriceKeyPress}
                                    onBlur={saveCustomTotalPrice}
                                    placeholder={`${total.toFixed(2)}`}
                                    className="text-xl sm:text-2xl font-bold bg-white text-blue-600 px-3 py-1 rounded-lg text-center w-32 focus:outline-none focus:ring-2 focus:ring-white"
                                    autoFocus
                                />
                                <button
                                    onClick={saveCustomTotalPrice}
                                    className="bg-white text-blue-600 px-2 py-1 rounded text-sm hover:bg-blue-50"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingCustomPrice(false);
                                        setCustomTotalPrice("");
                                    }}
                                    className="bg-white text-red-600 px-2 py-1 rounded text-sm hover:bg-blue-50"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div 
                                className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
                                onClick={() => setIsAddingCustomPrice(true)}
                                title="Click to set custom total price"
                            >
                                <div className="flex items-center gap-2">
                                    <span>Total: ${formData.custom! > 0 ? formData.custom!.toFixed(2) : total.toFixed(2)}</span>
                                    {formData.custom !== undefined && (
                                        <>
                                            <span className="text-sm opacity-75">
                                                {formData.custom! > 0 && (
                                                    <>
                                                    <span className="text-sm opacity-75">
                                                        (calc: ${calculatedPrice.toFixed(2)})
                                                    </span>
                                                        <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            resetCustomPrice();
                                                        }}
                                                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-2 py-1 rounded text-xs transition-all"
                                                        title="Reset to calculated price"
                                                    >
                                                        ↺
                                                    </button>
                                                    </>
                                                )}
                                            </span>
                                        
                                        </>
                                    ) }
                                </div>
                            </div>
                        )}
                        <div className="text-xs sm:text-sm mt-1 opacity-90 flex items-center justify-center gap-1">

                                <>
                                    New Order: {formData.customerName || "Unnamed Customer"}
                                </>

                        </div>

                        <div className="mt-4 grid grid-cols-12 gap-3">
                            <button
                                onClick={async () => {
                                   useOrderStore.getState().updateOrder(currentLeadID);
                                   useOrderStore.getState().resetForm()

                                }}
                                className={`col-span-12 py-3 rounded-2xl border shadow transition flex items-center justify-center gap-2 ${
                                    isSaving
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
                                        : "bg-white text-black border-gray-300 hover:shadow-md hover:bg-gray-50"
                                }`}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                { `Update order : ${currentLeadID}`}
                            </button>


                        </div>

                        <div className="mt-3 text-[11px] sm:text-xs opacity-80 flex items-center justify-center gap-2">

                                <>
                                    <Save className="w-3 h-3" />
                                    Save = Create final order 
                               
                                </>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
