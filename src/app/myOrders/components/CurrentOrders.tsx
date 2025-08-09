import React, {useEffect} from 'react';
import { OrderStatus } from "@/types/api";
import OrderCard from './OrderCard';
import {useOrderStore} from "@/stores/orderStore"; // Импортируйте ваш компонент
import { TransferStatus } from '@/types/formDataType';


export default function OrdersDemo() {
    const {fetchOrders, orders} = useOrderStore();
    useEffect(() => {
        fetchOrders();
    }, []);
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
    const changeStatus = useOrderStore(state => state.changeStatus)
    console.log(orders)
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    📋 My Orders
                </h1>
                <div className="text-gray-600">
                    Showing {orders.length} orders
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
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200">
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Список заказов */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map(order => (
                    <OrderCard
                        key={order._id}
                        order={order}
                        // onStatusChange={handleStatusChange}
                        onChangeStatus={(id, st) => changeStatus(order.text_status, order.order_id)}
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