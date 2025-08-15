"use client"
import BufferCard from "@/app/buffer/components/BufferCard";
import { useState, useEffect } from "react";
import { useOrderStore } from "@/stores/orderStore";
import {
    RefreshCw,
    Users,
    ArrowRightLeft,
    Globe,
    Clock,
    AlertCircle,
    Loader2,
    Package
} from "lucide-react";
import type { OrderBuffer } from "@/stores/orderStore";
import {isExternal} from "node:util/types";

// Типы для фильтрации
type FilterType = 'all' | 'external' | 'internal';

// Интерфейс для данных карточки (адаптация OrderBuffer к props BufferCard)
interface BufferCardData {
    id: string;
    transferredFrom: string;
    team: string;
    timeAgo: string;
    clientId: string;
    address: string;
    date: string;
    time: string;
    amount: number;
    type: 'external' | 'internal';
}

export default function BufferedOrders() {
    const {
        currentUser,
        fetchBufferOrders,
        allBufferOrders,
        internalOrders,
        externalOrders,
        bufferStats,
        isLoadingBuffer,
        bufferError,
        claimBufferOrder,
        refreshBuffer
    } = useOrderStore();

    const [selectedType, setSelectedType] = useState<FilterType>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Загружаем данные при монтировании компонента
    useEffect(() => {
        if (currentUser?.team) {
            fetchBufferOrders();
        }
    }, [currentUser?.team, fetchBufferOrders]);

    // Функция для вычисления времени назад
    const getTimeAgo = (dateString: string): string => {
        const now = new Date();
        const transferDate = new Date(dateString);
        const diffMs = now.getTime() - transferDate.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    // Функция для конвертации OrderBuffer в формат для BufferCard
    const convertOrderBufferToCardData = (order: OrderBuffer): BufferCardData => {
        const isExternal = order.data.transferred_from.team !== currentUser?.team;
        console.log()
        return {
            amount: order.data.total,
            id: order.order_id,
            transferredFrom: order.data.transferred_from.user_name,
            team: order.data.transferred_from.team,
            timeAgo: getTimeAgo(order.data.transferred_at),
            clientId: order.order_id,
            address: "Address not available", // Адрес не доступен в данных буфера
            date: new Date(order.data.transferred_at).toLocaleDateString(),
            time: new Date(order.data.transferred_at).toLocaleTimeString(),
            type: isExternal ? 'external' : 'internal'
        };
    };

    // Получаем отфильтрованные заказы
    const getFilteredOrders = (): BufferCardData[] => {
        let orders: OrderBuffer[] = [];

        switch (selectedType) {
            case 'external':
                orders = externalOrders;
                break;
            case 'internal':
                orders = internalOrders;
                break;
            case 'all':
            default:
                orders = allBufferOrders;
                break;
        }

        return orders.map(convertOrderBufferToCardData);
    };

    const filteredOrders = getFilteredOrders();

    // Обработчик для claim заказа
    const handleClaim = async (orderId: string) => {
        console.log(`Claiming order: ${orderId}`);
        const success = await claimBufferOrder(orderId,currentUser?.team);
        if (success) {
            // Обновляем буфер после успешного claim
            await refreshBuffer();
        }
    };

    // Обработчик обновления
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshBuffer();
        } finally {
            setIsRefreshing(false);
        }
    };

    // Если нет пользователя
    if (!currentUser) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Authentication Required
                        </h3>
                        <p className="text-gray-500">
                            Please log in to view buffer orders
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Если ошибка загрузки
    if (bufferError) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Error Loading Buffer
                        </h3>
                        <p className="text-gray-500 mb-4">{bufferError}</p>
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Package className="w-6 h-6" />
                            Buffer Orders
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Orders categorized by transfer type and team - Team {currentUser.team}
                        </p>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        disabled={isRefreshing || isLoadingBuffer}
                    >
                        {isRefreshing || isLoadingBuffer ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="bg-orange-100 px-4 py-2 rounded-lg inline-block">
                    <span className="text-orange-800 font-semibold">
                        {filteredOrders.length} {selectedType === 'all' ? 'total' : selectedType} orders
                    </span>
                    {bufferStats.lastUpdated && (
                        <span className="text-orange-600 text-sm ml-2">
                            • Updated {getTimeAgo(bufferStats.lastUpdated)}
                        </span>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoadingBuffer && !isRefreshing ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-600">Loading buffer orders...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Filter buttons */}
                    <div className="mb-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                                selectedType === 'all'
                                    ? 'bg-orange-600'
                                    : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            All Orders ({bufferStats.totalCount})
                        </button>

                        <button
                            onClick={() => setSelectedType('external')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                                selectedType === 'external'
                                    ? 'bg-indigo-600'
                                    : 'bg-indigo-400 hover:bg-indigo-500'
                            }`}
                        >
                            <Globe className="w-4 h-4" />
                            From Other Teams ({bufferStats.externalCount})
                        </button>

                        <button
                            onClick={() => setSelectedType('internal')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                                selectedType === 'internal'
                                    ? 'bg-yellow-600'
                                    : 'bg-yellow-400 hover:bg-yellow-500'
                            }`}
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Internal Transfers ({bufferStats.internalCount})
                        </button>
                    </div>

                    {/* Orders Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {filteredOrders.map((order) => (
                            <BufferCard
                                key={order.id}
                                id={order.id}
                                transferredFrom={order.transferredFrom}
                                team={order.team}
                                timeAgo={order.timeAgo}
                                clientId={order.clientId}
                                address={order.address}
                                date={order.date}
                                time={order.time}
                                amount={order.amount}
                                type={order.type}
                                onClaim={() => handleClaim(order.id)}
                            />
                        ))}
                    </div>

                    {/* Empty state */}
                    {filteredOrders.length === 0 && !isLoadingBuffer && (
                        <div className="text-center py-12">
                            <div className="text-center">
                                {selectedType === 'external' ? (
                                    <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                ) : selectedType === 'internal' ? (
                                    <ArrowRightLeft className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                ) : (
                                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                )}
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No {selectedType === 'all' ? '' : selectedType} orders in buffer
                                </h3>
                                <p className="text-gray-500">
                                    {selectedType === 'all'
                                        ? "Buffer is empty. Orders will appear here when transferred."
                                        : `No ${selectedType} orders available. Try selecting a different category.`
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}