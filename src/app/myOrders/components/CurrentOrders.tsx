import { useOrderStore } from "@/stores/orderStore"
import { OrderStatus } from "@/types/api"
import { Folder, RefreshCw, Search, X } from "lucide-react"
import React, { useEffect, useState } from 'react'
import OrderCard from './OrderCard'

export default function OrdersDemo() {
    const {
        fetchOrders,
        orders,
        isLoading,
        error,
        // Pagination
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
        // Status
        changeStatus,
        // Search
        searchOrders,
        searchResults,
        isSearching,
        currentUser
    } = useOrderStore();

    // Local states for filters
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        console.log(`Changing status of order ${orderId} to ${newStatus}`);
        // Here will be API call to change status
    };

    const handleViewDetails = (orderId: string) => {
        console.log(`Viewing details for order ${orderId}`);
        // Here will be navigation to order details page
    };

    const handleEditOrder = (orderId: string) => {
        console.log(`Editing order ${orderId}`);
        // Here will be navigation to order edit page
    };

    const handleRefresh = () => {
        if (isSearchMode) {
            setSearchQuery('');
            setIsSearchMode(false);
        }
        // Сбрасываем фильтр статуса при обновлении
        setStatusFilter('');
        fetchOrders({ page: currentPage, limit: ordersPerPage });
    };

    const handleStatusFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        // Применяем фильтр и переходим на первую страницу
        fetchOrders({ page: 1, limit: ordersPerPage }, { text_status: newStatus || undefined });
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearchMode(true);
        setStatusFilter(''); // Сбрасываем фильтр статуса при поиске
        await searchOrders(searchQuery.trim());
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchMode(false);
        setStatusFilter('');
        fetchOrders({ page: currentPage, limit: ordersPerPage });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Generate page numbers for display
    const getPageNumbers = () => {
        const totalPages = getTotalPages();
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            // If few pages, show all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show with ellipsis: current +/- 2
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

    // Determine which orders to display - только мои заказы
    const filteredOrders = statusFilter 
        ? orders.filter(order => order.text_status === statusFilter)
        : orders;
    
    const displayOrders = isSearchMode ? searchResults?.myOrders || [] : filteredOrders;
    const displayCount = isSearchMode ? searchResults?.counts?.my || 0 : (statusFilter ? filteredOrders.length : totalOrders);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <div className="flex flex-row items-center gap-2">
                    <Folder size={24} className="text-gray-800" />
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isSearchMode ? 'Результаты поиска' : 'Мои заказы'}
                    </h1>
                </div>
                <div className="text-gray-600">
                    {isSearchMode ? (
                        <>
                            Found {displayCount} your orders
                            {searchResults?.searchQuery && (
                                <span className="ml-2 text-blue-600">
                                    for "{searchResults.searchQuery}" ({searchResults.searchType})
                                </span>
                            )}
                            {searchResults?.counts && searchResults.counts.notMy > 0 && (
                                <span className="ml-2 text-gray-500">
                                    ({searchResults.counts.notMy} other team orders hidden)
                                </span>
                            )}
                        </>
                    ) : pagination ? (
                        <>
                            {statusFilter ? (
                                `Показано ${filteredOrders.length} заказов со статусом "${statusFilter}"`
                            ) : (
                                `Showing ${((currentPage - 1) * ordersPerPage) + 1}-${Math.min(currentPage * ordersPerPage, totalOrders)} of ${totalOrders} orders`
                            )}
                        </>
                    ) : (
                        statusFilter ? 
                            `Показано ${filteredOrders.length} заказов со статусом "${statusFilter}"` :
                            `Showing ${orders.length} orders`
                    )}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Search Input */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, phone, address, or ZIP..."
                                    className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm w-96"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={!searchQuery.trim() || isSearching}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSearching ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search size={16} />
                                        Search
                                    </>
                                )}
                            </button>
                            {isSearchMode && (
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
                                >
                                    <X size={16} />
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                value={statusFilter}
                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                            >
                                <option value="">Все статусы</option>
                                <option value={OrderStatus.IN_WORK}>{OrderStatus.IN_WORK}</option>
                                <option value={OrderStatus.COMPLETED}>{OrderStatus.COMPLETED}</option>
                                <option value={OrderStatus.CANCELLED}>{OrderStatus.CANCELLED}</option>
                                <option value={OrderStatus.INVALID}>{OrderStatus.INVALID}</option>
                                <option value={OrderStatus.OTHER_REGION}>{OrderStatus.OTHER_REGION}</option>
                                <option value={OrderStatus.NO_ANSWER}>{OrderStatus.NO_ANSWER}</option>
                                <option value={OrderStatus.NIGHT}>{OrderStatus.NIGHT}</option>
                                <option value={OrderStatus.NIGHT_EARLY}>{OrderStatus.NIGHT_EARLY}</option>
                                <option value={OrderStatus.NEED_CONFIRMATION}>{OrderStatus.NEED_CONFIRMATION}</option>
                                <option value={OrderStatus.NEED_APPROVAL}>{OrderStatus.NEED_APPROVAL}</option>
                                <option value={OrderStatus.CALL_TOMORROW}>{OrderStatus.CALL_TOMORROW}</option>
                                <option value={OrderStatus.ORDER_STATUS}>{OrderStatus.ORDER_STATUS}</option>
                            </select>
                            {statusFilter && (
                                <button
                                    onClick={() => handleStatusFilterChange('')}
                                    className="px-2 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                                    title="Сбросить фильтр статуса"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Per Page Selector */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">На странице:</label>
                            <select
                                value={ordersPerPage}
                                onChange={(e) => {
                                    const newLimit = Number(e.target.value);
                                    if (statusFilter) {
                                        fetchOrders({ page: 1, limit: newLimit }, { text_status: statusFilter });
                                    } else {
                                        changePageSize(newLimit);
                                    }
                                }}
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
                        disabled={isLoading || isSearching}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {(isLoading || isSearching) ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} />
                                {isSearchMode ? 'Back to Orders' : 'Refresh'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Results Summary */}
            {isSearchMode && searchResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-blue-900">Your Search Results</h3>
                            <div className="text-sm text-blue-700 mt-1">
                                <span className="font-medium text-green-700">{searchResults.counts.my}</span> of your orders found
                                {searchResults.counts.notMy > 0 && (
                                    <span className="ml-4 text-gray-600">
                                        ({searchResults.counts.notMy} other team orders not shown)
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            Search type: {searchResults.searchType}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-red-600">⚠</span>
                        <span className="text-red-800 font-medium">Error:</span>
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {(isLoading || isSearching) && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">
                            {isSearching ? 'Searching orders...' : 'Loading orders...'}
                        </span>
                    </div>
                </div>
            )}

            {/* Orders List */}
            {!isLoading && !isSearching && (
                <>
                    {displayOrders.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayOrders.map(order => (
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
                            <h3 className="text-xl font-medium text-gray-600 mb-2">
                                {isSearchMode ? 'No your orders found' : 'No orders found'}
                            </h3>
                            <p className="text-gray-500">
                                {isSearchMode
                                    ? 'No orders belonging to you match the search criteria. Try different keywords.'
                                    : 'There are no orders matching your criteria.'
                                }
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Pagination - Only for regular orders, not search */}
            {!isSearchMode && pagination && totalPages > 1 && !isLoading && (
                <div className="mt-8">
                    {/* Information about results */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages} • Total {totalOrders} orders
                        </div>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center justify-center gap-1">
                        {/* Previous button */}
                        <button
                            onClick={() => {
                                const prevPage = currentPage - 1;
                                if (statusFilter) {
                                    fetchOrders({ page: prevPage, limit: ordersPerPage }, { text_status: statusFilter });
                                } else {
                                    fetchPrevPage();
                                }
                            }}
                            disabled={!hasPrevPage() || isLoading}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Предыдущая
                        </button>

                        {/* Page numbers */}
                        {getPageNumbers().map((page, index) => (
                            <div key={index}>
                                {page === '...' ? (
                                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (statusFilter) {
                                                fetchOrders({ page: page as number, limit: ordersPerPage }, { text_status: statusFilter });
                                            } else {
                                                fetchPage(page as number);
                                            }
                                        }}
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

                        {/* Next button */}
                        <button
                            onClick={() => {
                                const nextPage = currentPage + 1;
                                if (statusFilter) {
                                    fetchOrders({ page: nextPage, limit: ordersPerPage }, { text_status: statusFilter });
                                } else {
                                    fetchNextPage();
                                }
                            }}
                            disabled={!hasNextPage() || isLoading}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Следующая →
                        </button>
                    </div>

                    {/* Fast navigation for large lists */}
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
                                            if (statusFilter) {
                                                fetchOrders({ page, limit: ordersPerPage }, { text_status: statusFilter });
                                            } else {
                                                fetchPage(page);
                                            }
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