"use client"
import {useEffect, useState} from 'react';
import {useRouter} from "next/navigation";

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('activeTab') || 'new-order';
        }
        return 'new-order';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('activeTab', activeTab);
        }
    }, [activeTab]);

    // Заглушечные данные
    const [bufferOrders] = useState([
        { id: 1, customerName: 'John Smith', total: 320, items: 4, date: '2025-08-03', status: 'в работе' },
        { id: 2, customerName: 'Mary Johnson', total: 150, items: 2, date: '2025-08-02', status: 'оформлен' }
    ]);

    const [myOrders] = useState([
        { id: 101, customerName: 'David Wilson', total: 280, items: 3, date: '2025-08-01', status: 'оформлен', phone: '+1234567890' },
        { id: 102, customerName: 'Sarah Brown', total: 450, items: 6, date: '2025-07-30', status: 'в работе', phone: '+1234567891' },
        { id: 103, customerName: 'Mike Davis', total: 120, items: 2, date: '2025-07-28', status: 'отменен', phone: '+1234567892' },
        { id: 104, customerName: 'Anna Taylor', total: 380, items: 5, date: '2025-07-25', status: 'оформлен', phone: '+1234567893' },
        { id: 105, customerName: 'Robert Lee', total: 220, items: 3, date: '2025-07-23', status: 'в работе', phone: '+1234567894' }
    ]);

    const handleClick = (tab: string) => {
        setActiveTab(tab);

        switch (tab) {
            case 'new-order':

                setActiveTab('new-order');
                router.push('/form');
                break;
            case 'buffer':

                setActiveTab('buffer');
                router.push('/buffer');
                break;
            case 'my-orders':

                setActiveTab('my-orders');
                router.push('/myOrders');
                break;
            case 'search':

                setActiveTab('search');
                router.push('/search');

                break;
            default:
                router.push('/');
        }
    };

    // Имитация текущего заказа (заглушка)
    const [hasCurrentOrder, setHasCurrentOrder] = useState(true);

    const filteredMyOrders = myOrders.filter(order =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery) ||
        order.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const saveToBuffer = () => {
        console.log('Сохранение в буфер (заглушка)');
        alert('Заказ сохранен в буфер!');
    };

    const saveToMyOrders = () => {
        console.log('Сохранение в мои заказы (заглушка)');
        alert('Заказ сохранен в мои заказы!');
    };

    const loadOrder = (orderId:string) => {
        console.log('Загрузка заказа:', orderId);
        alert(`Загружен заказ #${orderId}`);
    };

    const removeFromBuffer = (orderId:string) => {
        console.log('Удаление из буфера:', orderId);
        alert(`Заказ #${orderId} удален из буфера`);
    };

    return (
        <div className="min-h-screen flex">
            <div className={`bg-white shadow-2xl transition-all duration-300 ${isExpanded ? 'w-80' : 'w-16'} flex flex-col border-r border-gray-200`}>
                {/* Header */}
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

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {isExpanded ? (
                        <div className="p-4 space-y-3">
                            {/* Navigation Buttons */}
                            <div className="space-y-2">
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
                                    onClick={() => setActiveTab('search')}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                        activeTab === 'search'
                                            ? 'bg-purple-100 text-purple-700 shadow-md'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-lg">🔍</span>
                                    <span>Search Orders</span>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="mt-6 flex-1 overflow-y-auto max-h-96">
                                {/* New Order Tab */}
                                {/*{activeTab === 'new-order' && (*/}
                                {/*    <div className="space-y-3">*/}
                                {/*        <div className="flex items-center justify-between mb-4">*/}
                                {/*            <h3 className="font-bold text-gray-800 text-sm">New Order</h3>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-center text-gray-500 py-8">*/}
                                {/*            <div className="text-4xl mb-2">➕</div>*/}
                                {/*            <div className="text-sm">Создайте новый заказ</div>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*)}*/}

                                {/* Buffer Tab */}
                                {activeTab === 'buffer' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-800 text-sm">Buffer Orders</h3>
                                            <span className="text-xs text-gray-500">{bufferOrders.length} orders</span>
                                        </div>

                                        {bufferOrders.map((order) => (
                                            <div key={order.id} className="bg-orange-50 border border-orange-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-sm">{order.customerName}</div>
                                                        <div className="text-xs text-gray-600">{order.date}</div>
                                                        <div className="text-xs text-orange-600 font-medium">{order.items} items • ${order.total}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromBuffer(order.id.toString())}
                                                        className="text-red-400 hover:text-red-600 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => loadOrder(order.id.toString())}
                                                    className="w-full bg-orange-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors duration-200"
                                                >
                                                    Load Order
                                                </button>
                                            </div>
                                        ))}

                                        {bufferOrders.length === 0 && (
                                            <div className="text-center text-gray-500 py-8">
                                                <div className="text-4xl mb-2">📋</div>
                                                <div className="text-sm">No orders in buffer</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/*/!* My Orders Tab *!/*/}
                                {/*{activeTab === 'my-orders' && (*/}
                                {/*    <div className="space-y-3">*/}
                                {/*        <div className="flex items-center justify-between mb-4">*/}
                                {/*            <h3 className="font-bold text-gray-800 text-sm">My Orders</h3>*/}
                                {/*            <span className="text-xs text-gray-500">{myOrders.length} orders</span>*/}
                                {/*        </div>*/}

                                {/*        {myOrders.slice(0, 10).map((order) => (*/}
                                {/*            <div key={order.id} className="bg-green-50 border border-green-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">*/}
                                {/*                <div className="flex justify-between items-start mb-2">*/}
                                {/*                    <div className="flex-1">*/}
                                {/*                        <div className="font-semibold text-sm">{order.customerName}</div>*/}
                                {/*                        <div className="text-xs text-gray-600">{order.phone}</div>*/}
                                {/*                        <div className="text-xs text-gray-600">{order.date}</div>*/}
                                {/*                        <div className="text-xs text-green-600 font-medium">{order.items} items • ${order.total}</div>*/}
                                {/*                    </div>*/}
                                {/*                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-200 text-green-800">*/}
                                {/*                        {order.status}*/}
                                {/*                    </span>*/}
                                {/*                </div>*/}
                                {/*            </div>*/}
                                {/*        ))}*/}
                                {/*    </div>*/}
                                {/*)}*/}

                                {/* Search Tab */}
                                {activeTab === 'search' && (
                                    <div className="space-y-3 ">
                                        <div className="mb-4">
                                            <h3 className="font-bold text-gray-800 mb-3 text-sm">Search Orders</h3>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search by name, phone, or status..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full p-2 pl-8 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-purple-400 focus:bg-white transition-all duration-200 text-sm"
                                                />
                                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                                                    🔍
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-90 overflow-y-auto">
                                            {filteredMyOrders.map((order) => (
                                                <div key={order.id} className="bg-purple-50 border border-purple-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-sm">{order.customerName}</div>
                                                            <div className="text-xs text-gray-600">{order.phone}</div>
                                                            <div className="text-xs text-gray-600">{order.date}</div>
                                                            <div className="text-xs text-purple-600 font-medium">${order.total}</div>
                                                        </div>
                                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-200 text-purple-800">
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}

                                            {searchQuery && filteredMyOrders.length === 0 && (
                                                <div className="text-center text-gray-500 py-8">
                                                    <div className="text-4xl mb-2">🔍</div>
                                                    <div className="text-sm">No orders found</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons - показываем если имитируем текущий заказ */}
                            {/*{hasCurrentOrder && (*/}
                            {/*    <div className="border-t pt-4 mt-4 space-y-2">*/}
                            {/*        <button*/}
                            {/*            onClick={saveToMyOrders}*/}
                            {/*            className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200"*/}
                            {/*        >*/}
                            {/*            💾 Save Order*/}
                            {/*        </button>*/}
                            {/*        <button*/}
                            {/*            onClick={saveToBuffer}*/}
                            {/*            className="w-full bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors duration-200"*/}
                            {/*        >*/}
                            {/*            📋 Save to Buffer*/}
                            {/*        </button>*/}
                            {/*        <button*/}
                            {/*            onClick={() => setHasCurrentOrder(false)}*/}
                            {/*            className="w-full bg-gray-400 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors duration-200"*/}
                            {/*        >*/}
                            {/*            🗑️ Clear Order*/}
                            {/*        </button>*/}
                            {/*    </div>*/}
                            {/*)}*/}
                        </div>
                    ) : (
                        /* Collapsed Sidebar */
                        <div className="p-2 space-y-2">
                            <button
                                onClick={() => handleClick('new-order')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'new-order' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="New Order"
                            >
                                <span className="text-lg">➕</span>
                            </button>

                            <button
                                onClick={() => handleClick('buffer')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative ${
                                    activeTab === 'buffer' ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
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
                                    activeTab === 'my-orders' ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="My Orders"
                            >
                                <span className="text-lg">📂</span>
                            </button>

                            <button
                                onClick={() => handleClick('search')}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
                                    activeTab === 'search' ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Search"
                            >
                                <span className="text-lg">🔍</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main content area for demonstration */}

        </div>
    );
}