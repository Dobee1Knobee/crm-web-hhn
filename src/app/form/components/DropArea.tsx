import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";

export interface ServiceItem {
    id: string;
    name: string;
    price: number;
    quantity?: number;
    orderId?: number;
}

interface DropAreaProps {
    items: ServiceItem[];
    onRemove: (id: string) => void;
    onUpdateQuantity?: (orderId: number, newQuantity: number) => void;
    onUpdatePrice?: (orderId: number, newPrice: number) => void;
    isDragOver?: boolean;
    draggedItem?: any;
}

export const DropArea: React.FC<DropAreaProps> = ({
                                                      items,
                                                      onRemove,
                                                      onUpdateQuantity,
                                                      onUpdatePrice,
                                                      isDragOver = false,
                                                      draggedItem = null
                                                  }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: "drop-area",
    });

    const [editingPrice, setEditingPrice] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState('');

    const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

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

    return (
        <div
            ref={setNodeRef}
            className={`w-full h-full rounded-xl border-4 border-dashed p-6 transition-colors duration-300 ${
                isOver || isDragOver ? "border-green-400 bg-green-50" : "border-blue-200 bg-blue-50"
            }`}
        >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                📋 Order Builder
            </h2>

            {items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <div className="text-8xl mb-6 opacity-50">📋</div>
                        <div className="text-xl font-medium text-gray-500 italic">
                            Your order is empty. Start by dragging services.
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-1 min-h-0 max-h-[400px] overflow-y-auto pr-2">
                        <ul className="space-y-3">
                            {items.map((item) => (
                                <li
                                    key={item.orderId || item.id}
                                    className="flex justify-between items-center bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex-1">
                                        <span className="font-medium">{item.name}</span>

                                        {item.quantity && item.quantity > 1 && (
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
                                                        <span className="text-green-600">× {item.quantity}</span>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className="text-green-600 font-semibold cursor-pointer hover:bg-green-50 px-2 py-1 rounded"
                                                        onClick={() => item.orderId && startPriceEdit(item.orderId, item.price)}
                                                    >
                                                        ${item.price} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {!item.quantity || item.quantity === 1 ? (
                                            <span className="text-green-600 font-semibold">
                                                ${item.price}
                                            </span>
                                        ) : (
                                            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                                                <button
                                                    onClick={() => item.orderId && updateQuantity(item.orderId, item.quantity! - 1)}
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center font-bold text-gray-800">{item.quantity}</span>
                                                <button
                                                    onClick={() => item.orderId && updateQuantity(item.orderId, item.quantity! + 1)}
                                                    className="w-8 h-8 bg-white rounded-lg shadow-sm text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => onRemove(item.orderId?.toString() || item.id)}
                                            className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 transition-colors duration-200"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold">
                                Total: ${total.toFixed(2)}
                            </div>
                            <div className="flex w-full justify-between gap-3 mt-4">
                                <button className="flex items-center justify-center gap-2 bg-white text-black w-1/2 py-4 rounded-2xl border border-gray-300 shadow hover:shadow-md transition-all">
                                    💾 <span>Save Order</span>
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-orange-400 text-white w-1/2 py-4 rounded-2xl shadow hover:bg-orange-500 transition-all">
                                    🚀 <span>Send to Buffer</span>
                                </button>
                            </div>

                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};