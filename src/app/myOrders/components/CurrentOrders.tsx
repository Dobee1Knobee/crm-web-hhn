import React, { useEffect, useState } from 'react';
import { OrderStatus } from "@/types/api";
import OrderCard from './OrderCard';
import { useOrderStore } from "@/stores/orderStore";
import { TransferStatus } from '@/types/formDataType';
import {FileText, Folder, RefreshCw} from "lucide-react";

export default function OrdersDemo() {
    const {
        fetchOrders,
        orders,
        isLoading,
        error,
        // Пагинация
        pagination,
        currentPage,
        ordersPerPage,
        fetchNextPage,
        fetchPrevPage,
        fetchPage,
        changePageSize,
        getTotalPages,
        getTotalOrders,
        hasNextPage,
        hasPrevPage,
        // Статусы
        changeStatus
    } = useOrderStore();

    // Локальные состояния для фильтров
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleRefresh = () => {
        fetchOrders({ page: currentPage, limit: ordersPerPage });
    };

    // Генерируем номера страниц для отображения
    const getPageNumbers = () => {
        const totalPages = getTotalPages();
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // Если страниц мало, показываем все
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Показываем с умом: текущая +/- 2
            const start = Math.max(1, currentPage - 2);
            const end = Math.min(totalPages, currentPage + 2);

            if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                if (end < totalPages - 1) pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const totalPages = getTotalPages();
    const totalOrders = getTotalOrders();

    console.log(orders);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <div className="flex flex-row items-center gap-2">
                    <Folder size={24} className="text-gray-800" />
                    <h1 className="text-2xl font-bold text-gray-800">
                        My Orders
                    </h1>
                </div>
                <div className="text-gray-600">
                    {pagination ? (
                        <>
                            Showing {((currentPage - 1) * ordersPerPage) + 1}-{Math.min(currentPage * ordersPerPage, totalOrders)} of {totalOrders} orders
                        </>
                    ) : (
                        `Showing ${orders.length} orders`
                    )}
                </div>
            </div>

            {/* Фильтры */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {/* Выбор количества на странице */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Per page:</label>
                            <select
                                value={ordersPerPage}
                                onChange={(e) => changePageSize(Number(e.target.value))}
                                disabled={isLoading}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                Refresh
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Ошибка */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-red-600">❌</span>
                        <span className="text-red-800 font-medium">Error:</span>
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* Индикатор загрузки */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Loading orders...</span>
                    </div>
                </div>
            )}

            {/* Список заказов */}
            {!isLoading && (
                <>
                    {orders.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {orders.map(order => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onChangeStatus={(id, st) => changeStatus(st, order.order_id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">📋</div>
                            <h3 className="text-xl font-medium text-gray-600 mb-2">No orders found</h3>
                            <p className="text-gray-500">There are no orders matching your criteria.</p>
                        </div>
                    )}
                </>
            )}

            {/* Пагинация */}
            {pagination && totalPages > 1 && !isLoading && (
                <div className="mt-8">
                    {/* Информация о результатах */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages} • Total {totalOrders} orders
                        </div>
                    </div>

                    {/* Навигация по страницам */}
                    <div className="flex items-center justify-center gap-1">
                        {/* Кнопка "Предыдущая" */}
                        <button
                            onClick={fetchPrevPage}
                            disabled={!hasPrevPage() || isLoading}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>

                        {/* Номера страниц */}
                        {getPageNumbers().map((page, index) => (
                            <div key={index}>
                                {page === '...' ? (
                                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                                ) : (
                                    <button
                                        onClick={() => fetchPage(page as number)}
                                        disabled={isLoading}
                                        className={`px-3 py-2 text-sm font-medium border ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Кнопка "Следующая" */}
                        <button
                            onClick={fetchNextPage}
                            disabled={!hasNextPage() || isLoading}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>

                    {/* Быстрая навигация для больших списков */}
                    {totalPages > 10 && (
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">Go to page:</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const page = Number(e.target.value);
                                        if (page >= 1 && page <= totalPages) {
                                            fetchPage(page);
                                        }
                                    }}
                                    disabled={isLoading}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="text-sm text-gray-500">of {totalPages}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}