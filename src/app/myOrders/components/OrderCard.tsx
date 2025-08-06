import React, { useState } from 'react';
import { OrderStatus } from "@/types/api";

interface OrderData {
    id: string;
    clientId: string;
    customerName: string;
    phone?: string;
    address?: string;
    zipCode?: string;
    date: string;
    time?: string;
    status: OrderStatus;
    total: number;
    services: {
        main: string[];
        additional: string[];
        materials: string[];
    };
    description?: string;
}

interface OrderCardProps {
    order: OrderData;
    onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
    onViewDetails?: (orderId: string) => void;
    onEditOrder?: (orderId: string) => void;
}

export default function OrderCard({ order, onStatusChange, onViewDetails, onEditOrder }: OrderCardProps) {
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);

    // Маппинг цветов для статусов (из вашего StatusPills)
    const statusColors = {
        [OrderStatus.CANCELLED]: { bg: '#470909', text: '#ffffff' },
        [OrderStatus.OTHER_REGION]: { bg: '#00e5ff', text: '#000000' },
        [OrderStatus.INVALID]: { bg: '#f44336', text: '#ffffff' },
        [OrderStatus.NO_ANSWER]: { bg: '#9e9e9e', text: '#ffffff' },
        [OrderStatus.IN_WORK]: { bg: '#ffff00', text: '#000000' },
        [OrderStatus.NIGHT]: { bg: '#1976d2', text: '#ffffff' },
        [OrderStatus.NIGHT_EARLY]: { bg: '#bfe1f6', text: '#000000' },
        [OrderStatus.NEED_CONFIRMATION]: { bg: '#76ff03', text: '#000000' },
        [OrderStatus.NEED_APPROVAL]: { bg: '#ffa726', text: '#000000' },
        [OrderStatus.COMPLETED]: { bg: '#2e7d32', text: '#ffffff' },
        [OrderStatus.CALL_TOMORROW]: { bg: '#e6cff1', text: '#000000' },
        [OrderStatus.ORDER_STATUS]: { bg: '#e0e0e0', text: '#000000' }
    };

    const handleStatusChange = (newStatus: OrderStatus) => {
        if (onStatusChange) {
            onStatusChange(order.id, newStatus);
        }
        setIsEditingStatus(false);
    };

    const getServicesSummary = () => {
        const { main, additional, materials } = order.services;
        const totalServices = main.length + additional.length + materials.length;

        if (main.length > 0) {
            const mainService = main[0];
            const additionalCount = additional.length + materials.length;
            return additionalCount > 0
                ? `${mainService} +${additionalCount} доп.`
                : mainService;
        }

        return `${totalServices} услуг`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const currentStatusColor = statusColors[order.status];

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 relative">
            {/* Header with ID and Status */}
            <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-gray-800">
                    ID:{order.id}
                </div>
                <div className="relative">
                    {isEditingStatus ? (
                        <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                            onBlur={() => setIsEditingStatus(false)}
                            className="text-xs px-2 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{
                                backgroundColor: currentStatusColor.bg,
                                color: currentStatusColor.text
                            }}
                            autoFocus
                        >
                            {Object.values(OrderStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    ) : (
                        <button
                            onClick={() => setIsEditingStatus(true)}
                            className="text-xs px-3 py-1 rounded-full font-medium hover:opacity-80 transition-opacity duration-200"
                            style={{
                                backgroundColor: currentStatusColor.bg,
                                color: currentStatusColor.text
                            }}
                        >
                            {order.status}
                        </button>
                    )}
                </div>
            </div>

            {/* Customer Info */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👤</span>
                </div>
                <div className="flex-1">
                    <div className="font-medium text-gray-800 text-sm">
                        {order.customerName}
                    </div>
                    <div className="text-xs text-gray-500">
                        📱 Client ID: #{order.clientId}
                    </div>
                </div>
            </div>


            {/* Address Info */}
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                <span>📍</span>
                <span>
                    {order.address && order.zipCode
                        ? `${order.address}, ${order.zipCode}`
                        : order.address
                            ? order.address
                            : 'Address not specified'
                    }
                </span>
            </div>

            {/* Date and Time */}
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
                <span>📅</span>
                <span>
                    {formatDate(order.date)}
                    {order.time && ` в ${order.time}`}
                </span>
            </div>

            {/* Services Summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-xs font-medium text-gray-700 mb-1">
                    📋 Услуги:
                </div>
                <div className="text-xs text-gray-600">
                    {getServicesSummary()}
                </div>
                {order.services.main.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {order.services.main.map((service, index) => (
                            <span key={index} className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                                {service}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            {order.description && (
                <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                        📝 Описание:
                    </div>
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        {showFullDescription
                            ? order.description
                            : order.description.length > 100
                                ? `${order.description.substring(0, 100)}...`
                                : order.description
                        }
                        {order.description.length > 100 && (
                            <button
                                onClick={() => setShowFullDescription(!showFullDescription)}
                                className="text-blue-600 hover:text-blue-800 ml-1 underline"
                            >
                                {showFullDescription ? 'Свернуть' : 'Показать все'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Footer with Total and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-800">
                        💰 ${order.total.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onViewDetails?.(order.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                        title="View Details"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => onEditOrder?.(order.id)}
                        className="text-orange-600 hover:text-orange-800 text-xs p-1 rounded hover:bg-orange-50 transition-colors duration-200"
                        title="Edit Order"
                    >
                        ✏️
                    </button>
                </div>
            </div>
        </div>
    );
}

// Компонент для списка заказов
export function OrdersList({ orders, onStatusChange, onViewDetails, onEditOrder }: {
    orders: OrderData[];
    onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
    onViewDetails?: (orderId: string) => void;
    onEditOrder?: (orderId: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={onStatusChange}
                    onViewDetails={onViewDetails}
                    onEditOrder={onEditOrder}
                />
            ))}
        </div>
    );
}