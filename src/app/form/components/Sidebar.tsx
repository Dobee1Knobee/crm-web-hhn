// src/app/form/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
    // state for expanded/collapsed sidebar
    const [isExpanded, setIsExpanded] = useState(false);

    // activeTab defaults to 'new-order' both on server and initial client render
    const [activeTab, setActiveTab] = useState<
        'new-order' | 'buffer' | 'my-orders' | 'search' | ''
    >('');

    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    // After mounting, load the saved tab from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('activeTab') as
            | 'new-order'
            | 'buffer'
            | 'my-orders'
            | 'search'
            | null;
        if (saved) {
            setActiveTab(saved);
        }
    }, []);

    // Persist activeTab whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    // Placeholder data
    const [bufferOrders] = useState([
        { id: 1, customerName: 'John Smith', total: 320, items: 4, date: '2025-08-03', status: 'в работе' },
        { id: 2, customerName: 'Mary Johnson', total: 150, items: 2, date: '2025-08-02', status: 'оформлен' },
    ]);
    const [myOrders] = useState([
        { id: 101, customerName: 'David Wilson', total: 280, items: 3, date: '2025-08-01', status: 'оформлен', phone: '+1234567890' },
        // … другие заказы …
    ]);

    // Navigation handler
    const handleClick = (tab: 'new-order' | 'buffer' | 'my-orders' | 'search') => {


        switch (tab) {
            case 'new-order':
                setActiveTab(tab);
                router.push('/form');
                break;
            case 'buffer':
                setActiveTab(tab);
                router.push('/buffer');
                setActiveTab(tab);

                break;
            case 'my-orders':
                setActiveTab(tab);
                router.push('/myOrders');
                break;
            case 'search':
                setActiveTab(tab);
                router.push('/search');
                break;
        }
    };

    // Filter for the Search tab
    const filteredMyOrders = myOrders.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone?.includes(searchQuery) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // (Optional) buffer actions
    const saveToBuffer = () => alert('Заказ сохранен в буфер!');
    const loadOrder = (orderId: number) => alert(`Загружен заказ #${orderId}`);
    const removeFromBuffer = (orderId: number) =>
        alert(`Заказ #${orderId} удален из буфера`);

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
                        <div className="p-4 space-y-3">
                            {/* Full sidebar buttons */}
                            <button
                                onClick={() => handleClick('new-order')}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                    activeTab === 'new-order'
                                        ? 'bg-blue-100 text-blue-700 shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-lg">➕</span>
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
                                    <span className="text-lg">📋</span>
                                    <span>Buffer</span>
                                </div>
                                {bufferOrders.length > 0 && (
                                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {bufferOrders.length}
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
                                <span className="text-lg">📂</span>
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
                                <span className="text-lg">🔍</span>
                                <span>Search Orders</span>
                            </button>

                            {/* Tab content */}
                            <div className="mt-6 flex-1 overflow-y-auto max-h-96">
                                {activeTab === 'search' && (
                                    <div className="space-y-3">
                                        <div className="relative mb-4">
                                            <input
                                                type="text"
                                                placeholder="Search by name, phone, or status."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full p-2 pl-8 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-purple-400 focus:bg-white transition-all duration-200 text-sm"
                                            />
                                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        🔍
                      </span>
                                        </div>
                                        {filteredMyOrders.map(order => (
                                            <div
                                                key={order.id}
                                                className="bg-purple-50 border border-purple-200 rounded-xl p-3 hover:shadow-md transition-all duration-200"
                                            >
                                                {/* …render search results… */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Add content for other tabs similarly */}
                            </div>
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
                                <span className="text-lg">➕</span>
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
                                <span className="text-lg">📋</span>
                                {bufferOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {bufferOrders.length}
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
                                <span className="text-lg">📂</span>
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
                                <span className="text-lg">🔍</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1">
                {/* Ваш основной контент здесь */}
            </div>
        </div>
    );
}
