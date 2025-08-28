// src/app/form/components/Sidebar.tsx
'use client';

import ConnectionStatus from '@/components/ConnectionStatus'
import { NoteOfClaimedOrder, useOrderStore } from '@/stores/orderStore'
import Order from "@/types/formDataType"
import {
    Calendar,
    Car,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
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
        'new-order' | 'buffer' | 'my-orders' | 'search' | 'visit' | 'schedule' | null
    >(null);

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
        formData,
        getByLeadID
    } = useOrderStore();
    const bufferCount = useOrderStore(state => state.bufferStats.totalCount);
    const { isSocketConnected} = useOrderStore();

    //Заклейменные заказы
    const noteOfClaimedOrder = useOrderStore(state => state.noteOfClaimedOrder);
    const clearClaimedOrders = useOrderStore(state => state.clearClaimedOrders);
    const syncClaimedOrders = useOrderStore(state => state.syncClaimedOrders);
 
    // Загрузка активного таба
    useEffect(() => {
        const saved = localStorage.getItem('activeTab') as
            | 'new-order' | 'buffer' | 'my-orders' | 'search' | 'visit' | null;
        if (saved) {
            setActiveTab(saved);
        }
    }, []);

    // Синхронизация заклейменных заказов при загрузке
    useEffect(() => {
        const syncedOrders = syncClaimedOrders();
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
            }, 500);

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

    // Обработка клика по заклеймленному заказу
    const handleTakeToWork = (order: NoteOfClaimedOrder) => {
        useOrderStore.setState({formIdClaimedOrderInProcess: order.form_id})

        useOrderStore.setState({
            formData: {
                ...useOrderStore.getState().formData,
                customerName: order.name,
                phoneNumber: order.telephone,
                city: order.city,
            }
        });
        
        setTimeout(() => {
            router.push('/form');
        }, 100);
    };

    // Navigation handler
    const handleClick = (tab: 'new-order' | 'buffer' | 'my-orders' | 'search' | 'visit' | 'schedule') => {
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
            case 'visit':
                router.push('/visits');
                break;
            case 'schedule':
                router.push('/schedule');
                break;
            case 'search':
                if(!isExpanded) {
                    setIsExpanded(true);
                }
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
        if (selectedNotMyOrder) {
            await viewNotMyOrder(selectedNotMyOrder.order_id);
            await getByLeadID(selectedNotMyOrder.order_id);
            setShowConfidentialModal(false);
            router.push('/changeOrder');
        }
    };

    // Отмена просмотра
    const handleCancelView = () => {
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
                bg-white shadow-lg transition-all duration-300 ease-out
                ${isExpanded ? 'w-72' : 'w-16'} flex flex-col border-r border-gray-100
            `}>
                {/* Compact Header */}
                <div className="p-2 border-b border-gray-100 bg-gray-50">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title={isExpanded ? "Свернуть" : "Развернуть"}
                    >
                        {isExpanded ? (
                            <ChevronLeft size={16} className="text-gray-600" />
                        ) : (
                            <ChevronRight size={16} className="text-gray-600" />
                        )}
                    </button>
                </div>
  
               
                <div className="flex-1 overflow-hidden">
                    {isExpanded ? (
                        <div className="p-2 space-y-2 h-full flex flex-col">
                            {/* Ultra-compact Claimed Orders */}
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                        <span>Claimed Orders</span>
                                        {noteOfClaimedOrder && Array.isArray(noteOfClaimedOrder) && noteOfClaimedOrder.length > 0 && (
                                            <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                                {noteOfClaimedOrder.length}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                
                                {noteOfClaimedOrder && Array.isArray(noteOfClaimedOrder) && noteOfClaimedOrder.length > 0 ? (
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {noteOfClaimedOrder.map(order => (
                                            <ClaimedOrderCard key={order.telephone} order={order} onTakeToWork={() => {handleTakeToWork(order)}} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-1.5 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <FileText size={10} className="mx-auto text-gray-300 mb-0.5" />
                                        <div className="text-xs text-gray-500">No orders</div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Compact Connection Status */}
                            <div className="flex-shrink-0">
                                <ConnectionStatus />
                            </div>

                            {/* Ultra-compact Navigation Buttons */}
                            <div className="flex-shrink-0 space-y-1.5">
                                <button
                                    onClick={() => handleClick('new-order')}
                                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'new-order'
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <Plus size={14} />
                                    <span>New Order</span>
                                </button>

                                <button
                                    onClick={() => handleClick('buffer')}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'buffer'
                                            ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <ClipboardList size={14} />
                                        <span>Buffer</span>
                                    </div>
                                    {bufferCount > 0 && (
                                        <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                            {bufferCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => handleClick('my-orders')}
                                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'my-orders'
                                            ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <Folder size={14} />
                                    <span>My Orders</span>
                                </button>
                                <button
                                    onClick={() => handleClick('visit')}
                                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'visit'
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <Car size={14} />
                                    <span>Visits</span>
                                </button>
                                <button
                                    onClick={() => handleClick('schedule')}
                                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'schedule'
                                            ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <Calendar size={14} />  
                                    <span>Schedule</span>
                                </button>
                                <button
                                    onClick={() => handleClick('search')}
                                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                                        activeTab === 'search'
                                            ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                    }`}
                                >
                                    <Search size={14} />
                                    <span>Search</span>
                                </button>
                            </div>

                            {/* Ultra-compact Search section */}
                            {activeTab === 'search' && (
                                <div className="flex-1 flex flex-col min-h-0 space-y-2">
                                    {/* Search input */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Order ID, Phone, ZIP..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full p-1.5 pl-7 border border-gray-200 rounded-lg bg-gray-50 focus:border-blue-400 focus:bg-white transition-colors duration-200 text-xs"
                                        />
                                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            <Search size={12} />
                                        </div>
                                        {isSearching && (
                                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Compact Search hints */}
                                    {!searchQuery && (
                                        <div className="text-xs text-gray-500 p-1.5 bg-gray-50 rounded-lg">
                                            <div className="font-medium mb-1">Examples:</div>
                                            <div>• AH0730003</div>
                                            <div>• 1234567890</div>
                                        </div>
                                    )}

                                    {/* Ultra-compact Search results */}
                                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                        {searchResults && searchResults.counts.total > 0 ? (
                                            <>
                                                {/* Summary */}
                                                <div className="text-xs text-gray-600 p-1.5 bg-gray-50 rounded-lg">
                                                    Found {searchResults.counts.total} orders
                                                    ({searchResults.counts.my} mine, {searchResults.counts.notMy} others)
                                                </div>

                                                {/* My orders */}
                                                {searchResults.myOrders.map(order => (
                                                    <div
                                                        key={order._id}
                                                        onClick={() => handleMyOrderClick(order)}
                                                        className="bg-green-50 border border-green-200 rounded-lg p-1.5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-semibold text-green-800 text-xs">
                                                                {order.order_id}
                                                            </div>
                                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                                                Mine
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <User size={10} />
                                                            {order.leadName || 'No name'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Phone size={10} />
                                                            {order.phone || 'No phone'}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">
                                                                {order.text_status || 'No status'}
                                                            </span>
                                                            <span className="font-semibold text-green-700 text-xs">
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
                                                        className="bg-orange-50 border border-orange-200 rounded-lg p-1.5 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="font-semibold text-orange-800 text-xs">
                                                                {order.order_id}
                                                            </div>
                                                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <Lock size={8} />
                                                                {order.owner}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <User size={10} />
                                                            {order.leadName || 'No name'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                                            <Phone size={10} />
                                                            ••••••••••
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-gray-500">
                                                                {order.text_status || 'No status'}
                                                            </span>
                                                            <span className="font-semibold text-orange-700 text-xs">
                                                                {formatCurrency(order.total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : searchResults && searchQuery ? (
                                            <div className="text-center py-4 text-gray-500">
                                                <div className="mb-1">
                                                    <Search size={20} className="mx-auto text-gray-400" />
                                                </div>
                                                <div className="text-xs">No orders found</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Ultra-compact collapsed sidebar */
                        <div className="p-2 space-y-2">
                            {/* Claimed Orders Count - Compact */}
                            {noteOfClaimedOrder && Array.isArray(noteOfClaimedOrder) && noteOfClaimedOrder.length > 0 && (
                                <div className="text-center mb-2">
                                    <div className="w-12 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                                        <span className="text-xs font-bold text-blue-700">{noteOfClaimedOrder.length}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Orders</div>
                                </div>
                            )}

                            <button
                                onClick={() => handleClick('new-order')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'new-order'
                                        ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="New Order"
                            >
                                <Plus size={16} />
                            </button>

                            <button
                                onClick={() => handleClick('buffer')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 relative ${
                                    activeTab === 'buffer'
                                        ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="Buffer"
                            >
                                <ClipboardList size={16} />
                                {bufferCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                        {bufferCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => handleClick('my-orders')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'my-orders'
                                        ? 'bg-green-50 text-green-600 shadow-sm border border-green-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="My Orders"
                            >
                                <Folder size={16} />
                            </button>
                            <button
                                onClick={() => handleClick('visit')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'visit'
                                        ? 'bg-green-50 text-green-600 shadow-sm border border-green-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="Visit"
                            >
                                <Car size={16} />
                            </button>
                            <button
                                onClick={() => handleClick('schedule')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                        activeTab === 'schedule'
                                            ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                                            : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="New Order"
                            >
                                <Calendar size={16} />
                            </button>
                            <button
                                onClick={() => handleClick('search')}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'search'
                                        ? 'bg-purple-50 text-purple-600 shadow-sm border border-purple-200'
                                        : 'text-gray-600 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                                }`}
                                title="Search"
                            >
                                <Search size={16} />
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
                        handleConfirmView();
                    }}
                    onCancel={() => {
                        handleCancelView();
                    }}
                    orderId={selectedNotMyOrder?.order_id}
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