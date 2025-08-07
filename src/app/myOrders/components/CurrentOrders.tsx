import React from 'react';
import { OrderStatus } from "@/types/api";
import OrderCard from './OrderCard'; // Импортируйте ваш компонент

// Placeholder данные для демонстрации
const placeholderOrders = [
    {
        id: "EC0801012",
        clientId: "c34682",
        customerName: "John Smith",
        phone: "+1 (555) 123-4567",
        address: "123 Main St",
        zipCode: "10001",
        date: "2025-01-15T14:30:00Z",
        time: "2:30 PM",
        status: OrderStatus.IN_WORK,
        total: 235.50,
        services: {
            main: ["Large TV Mounting"],
            additional: ["Soundbar Installation", "Cable Management"],
            materials: ["HDMI Cable", "Wall Mount"]
        },
        description: "65 inch Samsung TV mounting on drywall. Customer wants soundbar mounted below TV and all cables hidden."
    },
    {
        id: "EC0801011",
        clientId: "c34681",
        customerName: "Sarah Johnson",
        phone: "+1 (555) 987-6543",
        address: "456 Oak Ave",
        zipCode: "10002",
        date: "2025-01-14T10:00:00Z",
        time: "10:00 AM",
        status: OrderStatus.COMPLETED,
        total: 158.00,
        services: {
            main: ["Standard TV Mounting"],
            additional: ["Outlet Installation"],
            materials: ["Fixed Mount", "Extension Cord"]
        },
        description: "Standard 55 inch TV mounting. New outlet needed behind TV."
    },
    {
        id: "EC0801010",
        clientId: "c34680",
        customerName: "Mike Davis",
        phone: "+1 (555) 456-7890",
        address: "789 Pine St",
        zipCode: "10003",
        date: "2025-01-13T16:45:00Z",
        time: "4:45 PM",
        status: OrderStatus.NIGHT_EARLY,
        total: 420.00,
        services: {
            main: ["Large x2 TV Mounting"],
            additional: ["Fireplace Mount", "Stone Wall", "Xbox Mount"],
            materials: ["Full Motion Mount", "Console Mount", "Cable Channel"]
        },
        description: "Two large TVs (75 and 65 inch) - one above fireplace on stone wall, second in bedroom. Xbox setup required."
    },
    {
        id: "EC0801009",
        clientId: "c34679",
        customerName: "Emily Wilson",
        phone: "+1 (555) 321-0987",
        address: "321 Elm Street",
        zipCode: "10004",
        date: "2025-01-12T09:15:00Z",
        time: "9:15 AM",
        status: OrderStatus.CANCELLED,
        total: 89.99,
        services: {
            main: ["NO TV"],
            additional: ["Dismount TV"],
            materials: []
        },
        description: "Customer only needs old TV removed and dismounted. No new installation."
    },
    {
        id: "EC0801008",
        clientId: "c34678",
        customerName: "Robert Brown",
        phone: "+1 (555) 654-3210",
        address: "654 Maple Dr",
        zipCode: "10005",
        date: "2025-01-11T13:20:00Z",
        time: "1:20 PM",
        status: OrderStatus.NEED_CONFIRMATION,
        total: 312.75,
        services: {
            main: ["Large TV Mounting"],
            additional: ["Soundbar Full", "Electric Fireplace", "Backlight"],
            materials: ["SB Mount Big", "HDMI 196″"]
        },
        description: "Premium setup: 70 inch TV above electric fireplace with full soundbar system and LED backlighting."
    },
    {
        id: "EC0801007",
        clientId: "c34677",
        customerName: "Lisa Garcia",
        phone: "+1 (555) 789-0123",
        address: "987 Cedar Lane",
        zipCode: "10006",
        date: "2025-01-10T11:30:00Z",
        time: "11:30 AM",
        status: OrderStatus.INVALID,
        total: 0.00,
        services: {
            main: [],
            additional: [],
            materials: []
        },
        description: "Invalid order - customer provided incorrect address and phone number not working."
    }
];

export default function OrdersDemo() {
    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        console.log(`Changing status of order ${orderId} to ${newStatus}`);
        // Здесь будет API вызов для изменения статуса
    };

    const handleViewDetails = (orderId: string) => {
        console.log(`Viewing details for order ${orderId}`);
        // Здесь будет переход на страницу деталей заказа
    };

    const handleEditOrder = (orderId: string) => {
        console.log(`Editing order ${orderId}`);
        // Здесь будет переход на страницу редактирования заказа
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    📋 My Orders
                </h1>
                <div className="text-gray-600">
                    Showing {placeholderOrders.length} orders
                </div>
            </div>

            {/* Фильтры */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Statuses</option>
                            <option value={OrderStatus.IN_WORK}>В работе</option>
                            <option value={OrderStatus.COMPLETED}>Завершен</option>
                            <option value={OrderStatus.CANCELLED}>Отменен</option>
                            <option value={OrderStatus.INVALID}>Невалидный</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search by ID or customer name..."
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
                        />
                    </div>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Список заказов */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {placeholderOrders.map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onViewDetails={handleViewDetails}
                        onEditOrder={handleEditOrder}
                    />
                ))}
            </div>

            {/* Пагинация */}
            <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                    <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
                        ← Previous
                    </button>
                    <span className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg">
                        Page 1 of 2
                    </span>
                    <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                        Next →
                    </button>
                </div>
            </div>
        </div>
    );
}