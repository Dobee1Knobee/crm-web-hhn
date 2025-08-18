// src/app/form/components/Sidebar.tsx
'use client';

import { useOrderStore } from '@/stores/orderStore'
import Order from "@/types/formDataType"
import {
    Calendar,
    ClipboardList,
    DollarSign,
    FileText,
    Folder,
    Lock,
    Phone,
    Plus,
    Search,
    User
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ClaimedOrderCard from './ClaimedOrderCard'
import ConfidentialViewModal from './ConfidentialViewModal'

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'new-order' | 'buffer' | 'my-orders' | 'search' | ''
    >('');

    // Состояния для поиска
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Состояния для модалки конфиденциальности
    const [selectedNotMyOrder, setSelectedNotMyOrder] = useState<Order>();
    const [showConfidentialModal, setShowConfidentialModal] = useState(false);

    const router = useRouter();

    // Данные из store
    const {
        orders,
        searchResults,
        isSearching,
        searchOrders,
        clearSearchResults,
        viewNotMyOrder,
        currentUser,
        getByLeadID // Для загрузки заказа
    } = useOrderStore();
    const bufferCount = useOrderStore(state => state.bufferStats.totalCount);
    const { isSocketConnected} = useOrderStore();

    //Заклейменные заказы
    const noteOfClaimedOrder = useOrderStore(state => state.noteOfClaimedOrder);
    const clearClaimedOrders = useOrderStore(state => state.clearClaimedOrders);
    const syncClaimedOrders = useOrderStore(state => state.syncClaimedOrders);
    
    // Отладочная информация
    console.log('🔍 Sidebar - noteOfClaimedOrder:', noteOfClaimedOrder);
    console.log('🔍 Sidebar - Type:', typeof noteOfClaimedOrder);
    console.log('🔍 Sidebar - Is Array:', Array.isArray(noteOfClaimedOrder));
    console.log('🔍 Sidebar - Length:', noteOfClaimedOrder?.length);
    console.log('🔍 Sidebar - sessionStorage:', sessionStorage.getItem('noteOfClaimedOrder'));


    // Загрузка активного таба
    useEffect(() => {
        const saved = localStorage.getItem('activeTab') as
            | 'new-order' | 'buffer' | 'my-orders' | 'search' | null;
        if (saved) {
            setActiveTab(saved);
        }
    }, []);

    // Синхронизация заклейменных заказов при загрузке
    useEffect(() => {
        console.log('🔄 Sidebar - Syncing claimed orders on mount');
        const syncedOrders = syncClaimedOrders();
        console.log('🔄 Sidebar - Synced orders:', syncedOrders);
    }, [syncClaimedOrders]);

    // Сохранение активного таба
    useEffect(() => {
        if (activeTab) {
            localStorage.setItem('activeTab', activeTab);
        }
    }, [activeTab]);

    // Debounced поиск
    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchQuery.trim() && searchQuery.length >= 3) {
            const timeout = setTimeout(() => {
                searchOrders(searchQuery);
            }, 500); // Задержка 500мс

            setSearchTimeout(timeout);
        } else if (searchQuery.length === 0) {
            clearSearchResults();
        }

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchQuery]);

    // Navigation handler
    const handleClick = (tab: 'new-order' | 'buffer' | 'my-orders' | 'search') => {
        setActiveTab(tab);

        switch (tab) {
            case 'new-order':
                router.push('/form');
                break;
            case 'buffer':
                router.push('/buffer');
                break;
            case 'my-orders':
                router.push('/myOrders');
                break;
            case 'search':
                if(!isExpanded) {
                    setIsExpanded(true);
                }
                // Остаемся на текущей странице, активируем поиск
                break;
        }
    };

    // Обработка клика по своему заказу
    const handleMyOrderClick = async (order:Order) => {
        try {
            await getByLeadID(order.order_id);
            router.push('/changeOrder');
        } catch (error) {
            console.error('Failed to load order:', error);
        }
    };

    // Обработка клика по чужому заказу
    const handleNotMyOrderClick = (order :Order) => {
        setSelectedNotMyOrder(order);
        setShowConfidentialModal(true);
    };

    // Подтверждение просмотра чужого заказа
    const handleConfirmView = async () => {
        console.log('🔍 handleConfirmView called');
        if (selectedNotMyOrder) {
            await viewNotMyOrder(selectedNotMyOrder.order_id);
            await getByLeadID(selectedNotMyOrder.order_id);
            setShowConfidentialModal(false);
            router.push('/changeOrder');
        }
    };

    // Отмена просмотра
    const handleCancelView = () => {
        console.log('🔍 handleCancelView called');
        setSelectedNotMyOrder(undefined);
        setShowConfidentialModal(false);
    };

    // Форматирование суммы
    const formatCurrency = (amount: number | undefined) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    return (
        <div className="min-h-screen flex">
            <div className={`
                bg-white shadow-2xl transition-all duration-300
                ${isExpanded ? 'w-80' : 'w-16'} flex flex-col border-r border-gray-200
            `}>
                {/* Header collapse button */}
                <div className="p-4 border-b border-gray-200">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                    >
                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            →
                        </span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    {isExpanded ? (
                        <div className="p-4 space-y-3 h-full flex flex-col">
                            {/* Claimed Orders Section */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Claimed Orders ({noteOfClaimedOrder?.length || 0})
                                    </h3>
                        
                                </div>
                                
                                {noteOfClaimedOrder && Array.isArray(noteOfClaimedOrder) && noteOfClaimedOrder.length > 0 ? (
                                    <div className="space-y-3">
                                        {noteOfClaimedOrder.map(order => (
                                            <ClaimedOrderCard key={order.telephone} order={order} onTakeToWork={() => {}} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <div className="mb-2">
                                            <FileText size={24} className="mx-auto text-gray-400" />
                                        </div>
                                        <div className="text-sm">No claimed orders yet</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                        Orders you claim from telegram will appear here
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Navigation buttons */}
                            <div>
                                {isSocketConnected ? (
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-600 rounded-full w-3 h-3 inline-block"></span>
                                        <span>You connected to team {currentUser?.team}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="bg-red-600 rounded-full w-3 h-3 inline-block"></span>
                                        <span>You disconnected</span>
                                    </div>
                                )}
                            </div>


                            <div className="space-y-3">
                                <button
                                    onClick={() => handleClick('new-order')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'new-order'
                                            ? 'bg-blue-100 text-blue-700 shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Plus size={18} />
                                    <span>New Order</span>
                                </button>

                                <button
                                    onClick={() => handleClick('buffer')}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'buffer'
                                            ? 'bg-orange-100 text-orange-700 shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <ClipboardList size={18} />
                                        <span>Buffer</span>
                                    </div>
                                    {bufferCount > 0 && (
                                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                            {bufferCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleClick('my-orders')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'my-orders'
                                            ? 'bg-green-100 text-green-700 shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Folder size={18} />
                                    <span>My Orders</span>
                                </button>

                                <button
                                    onClick={() => handleClick('search')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'search'
                                            ? 'bg-purple-100 text-purple-700 shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Search size={18} />
                                    <span>Search Orders</span>
                                </button>
                            </div>

                            {/* Search section */}
                            {activeTab === 'search' && (
                                <div className="flex-1 flex flex-col min-h-0">
                                    {/* Search input */}
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            placeholder="Order ID, Phone, ZIP, Address..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full p-3 pl-10 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-purple-400 focus:bg-white transition-all duration-200 text-sm"
                                        />
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            <Search size={16} />
                                        </div>
                                        {isSearching && (
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search hints */}
                                    {!searchQuery && (
                                        <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
                                            <div className="font-medium mb-1">Examples:</div>
                                            <div>• AH0730003</div>
                                            <div>• 1234567890</div>
                                            <div>• Brooklyn</div>
                                        </div>
                                    )}

                                    {/* Search results */}
                                    <div className="flex-1 overflow-y-auto space-y-2">
                                        {searchResults && searchResults.counts.total > 0 ? (
                                            <>
                                                {/* Summary */}
                                                <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded-lg">
                                                    Found {searchResults.counts.total} orders
                                                    ({searchResults.counts.my} mine, {searchResults.counts.notMy} others)
                                                </div>

                                                {/* My orders */}
                                                {searchResults.myOrders.map(order => (
                                                    <div
                                                        key={order._id}
                                                        onClick={() => handleMyOrderClick(order)}
                                                        className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="font-semibold text-green-800 text-sm">
                                                                {order.order_id}
                                                            </div>
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                                Mine
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <User size={12} />
                                                            {order.leadName || 'No name'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Phone size={12} />
                                                            {order.phone || 'No phone'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            {order.createdAt?.toString().split('T')[0] || 'No date'}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">
                                                                {order.text_status || 'No status'}
                                                            </span>
                                                            <span className="font-semibold text-green-700 flex items-center gap-1">
                                                                {formatCurrency(order.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Not my orders */}
                                                {searchResults.notMyOrders.map(order => (
                                                    <div
                                                        key={order._id}
                                                        onClick={() => handleNotMyOrderClick(order)}
                                                        className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="font-semibold text-orange-800 text-sm">
                                                                {order.order_id}
                                                            </div>
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                                                                <Lock size={10} />
                                                                {order.owner}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <User size={12} />
                                                            {order.leadName || 'No name'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Phone size={12} />
                                                            ••••••••••
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">
                                                                {order.text_status || 'No status'}
                                                            </span>
                                                            <span className="font-semibold text-orange-700 flex items-center gap-1">
                                                                <DollarSign size={12} />
                                                                {formatCurrency(order.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : searchResults && searchQuery ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="mb-2">
                                                    <Search size={32} className="mx-auto text-gray-400" />
                                                </div>
                                                <div className="text-sm">No orders found</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Collapsed sidebar */
                        <div className="p-2 space-y-2">
                            <button
                                onClick={() => handleClick('new-order')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'new-order'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="New Order"
                            >
                                <Plus size={18} />
                            </button>

                            <button
                                onClick={() => handleClick('buffer')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                                    activeTab === 'buffer'
                                        ? 'bg-orange-100 text-orange-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Buffer"
                            >
                                <ClipboardList size={18} />
                                {bufferCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                        {bufferCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleClick('my-orders')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'my-orders'
                                        ? 'bg-green-100 text-green-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="My Orders"
                            >
                                <Folder size={18} />
                            </button>

                            <button
                                onClick={() => handleClick('search')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'search'
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Search"
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно конфиденциальности */}
            {showConfidentialModal && (
                <ConfidentialViewModal
                    isOpen={showConfidentialModal}
                    onConfirm={() => {
                        console.log('🔍 onConfirm called');
                        handleConfirmView();
                    }}
                    onCancel={() => {
                        console.log('🔍 onCancel called');
                        handleCancelView();
                    }}
                    orderInfo={selectedNotMyOrder ? {
                        order_id: selectedNotMyOrder.order_id,
                        owner: selectedNotMyOrder.owner,
                        leadName: selectedNotMyOrder.leadName,
                        text_status: selectedNotMyOrder.text_status
                    } : {
                        order_id: undefined,
                        owner: undefined,
                        leadName: undefined,
                        text_status: undefined
                    }}
                />
            )}

            {/* Main content area */}
            <div className="flex-1">
                {/* Ваш основной контент здесь */}
            </div>
        </div>
    );
}