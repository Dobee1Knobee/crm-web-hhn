'use client';

import { useState } from 'react';
import { useUserByAt } from '@/hooks/useUserByAt';

export default function OrdersPage() {
    const [username] = useState('devapi1'); // Пока хардкод для тестирования

    // Получаем данные пользователя
    const user = useUserByAt(username);

    // Получаем заказы
    // const { orders, loading, error, pagination, refetch } = useOrders({
    //     username,
    //     page: 1,
    //     limit: 5,
    //     autoFetch: true
    // });

    if (!user) {
        return <div className="p-8">Loading user...</div>;
    }

    return (
        <>
        </>
    //     <div className="max-w-4xl mx-auto p-8">
    //     <div className="mb-6">
    //     <h1 className="text-3xl font-bold">Orders</h1>
    //         <p className="text-gray-600">
    //     User: {user.name} | Team: {user.team} | Status: {user.working ? '🟢 On Shift' : '🔴 Off Shift'}
    // </p>
    // </div>
    //
    // {/* Кнопка обновления */}
    // <div className="mb-4">
    // <button
    //     onClick={refetch}
    // disabled={loading}
    // className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    //     >
    //     {loading ? 'Loading...' : 'Refresh Orders'}
    //     </button>
    //     </div>
    //
    // {/* Ошибка */}
    // {error && (
    //     <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
    //         Error: {error}
    //     </div>
    // )}
    //
    // {/* Список заказов */}
    // {loading && orders.length === 0 ? (
    //     <div className="text-center py-8">Loading orders...</div>
    // ) : (
    //     <div className="space-y-4">
    //         {orders.map((order) => (
    //                 <div key={order.id} className="border rounded-lg p-4 shadow-sm">
    //             <div className="flex justify-between items-start mb-2">
    //             <h3 className="font-semibold">#{order.id}</h3>
    // <span className={`px-2 py-1 rounded text-sm ${
    //     order.status === 'Оформлен' ? 'bg-green-100 text-green-800' :
    //         order.status === 'В работе' ? 'bg-yellow-100 text-yellow-800' :
    //             'bg-gray-100 text-gray-800'
    // }`}>
    //     {order.status}
    //     </span>
    //     </div>
    //
    //     <p className="text-gray-600">Customer: {order.customerName}</p>
    // <p className="text-gray-600">Address: {order.address}</p>
    // <p className="text-gray-600">Phone: {order.phone}</p>
    // <p className="font-medium">Total: ${order.total}</p>
    //
    //     {order.transferInfo && (
    //         <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
    //         <span className="text-orange-800 text-sm">
    //                                     🔄 Transfer Status: {order.transferInfo.status}
    //         </span>
    //         </div>
    //     )}
    //     </div>
    // ))}
    //     </div>
    // )}
    //
    // {/* Пагинация */}
    // {pagination && (
    //     <div className="mt-6 flex justify-between items-center">
    //     <p className="text-gray-600">
    //         Page {pagination.currentPage} of {pagination.totalPages}
    //     ({pagination.totalOrders} total orders)
    //     </p>
    //
    //     <div className="space-x-2">
    // <button
    //     disabled={!pagination.hasPrev || loading}
    //     className="px-3 py-1 border rounded disabled:opacity-50"
    //         >
    //         Previous
    //         </button>
    //         <button
    //     disabled={!pagination.hasNext || loading}
    //     className="px-3 py-1 border rounded disabled:opacity-50"
    //         >
    //         Next
    //         </button>
    //         </div>
    //         </div>
    // )}
    // </div>
);
}
