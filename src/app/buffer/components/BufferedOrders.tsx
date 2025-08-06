"use client"
import BufferCard from "@/app/buffer/components/BufferCard";
import { useState } from "react";

// Моковые данные для разных заказов
const mockBufferOrders = [
    // Переданные из другой команды
    {
        id: "EC0801001",
        transferredFrom: "Egor Biriukov",
        team: "C",
        timeAgo: "0 min ago",
        clientName: "adead",
        clientId: "c34669",
        address: "Address not specified",
        date: "01.08.2025",
        time: "11:52",
        amount: 0,
        type: "external" as const
    },
    {
        id: "TV0801245",
        transferredFrom: "Sarah Johnson",
        team: "A",
        timeAgo: "5 min ago",
        clientName: "John Smith",
        clientId: "c41256",
        address: "123 Main St, Los Angeles, CA 90210",
        date: "01.08.2025",
        time: "11:47",
        amount: 285,
        type: "external" as const
    },
    {
        id: "MT0801156",
        transferredFrom: "Mike Rodriguez",
        team: "B",
        timeAgo: "12 min ago",
        clientName: "Emily Davis",
        clientId: "c38944",
        address: "456 Oak Avenue, Miami, FL 33101",
        date: "01.08.2025",
        time: "11:40",
        amount: 450,
        type: "external" as const
    },
    // Переданные внутри команды
    {
        id: "SV0801089",
        transferredFrom: "Alex Chen",
        team: "current",
        timeAgo: "18 min ago",
        clientName: "Robert Wilson",
        clientId: "c42301",
        address: "789 Pine Road, New York, NY 10001",
        date: "01.08.2025",
        time: "11:34",
        amount: 150,
        type: "internal" as const
    },
    {
        id: "LG0801378",
        transferredFrom: "Jessica Brown",
        team: "current",
        timeAgo: "25 min ago",
        clientName: "Maria Garcia",
        clientId: "c35677",
        address: "321 Elm Street, Las Vegas, NV 89101",
        date: "01.08.2025",
        time: "11:27",
        amount: 620,
        type: "internal" as const
    },
    {
        id: "HD0801432",
        transferredFrom: "David Lee",
        team: "current",
        timeAgo: "32 min ago",
        clientName: "James Thompson",
        clientId: "c40188",
        address: "654 Maple Drive, Atlanta, GA 30301",
        date: "01.08.2025",
        time: "11:20",
        amount: 95,
        type: "internal" as const
    },
    // Ожидающие обработки
    {
        id: "XL0801567",
        transferredFrom: "System",
        team: "pending",
        timeAgo: "45 min ago",
        clientName: "Lisa Anderson",
        clientId: "c37499",
        address: "987 Cedar Lane, Phoenix, AZ 85001",
        date: "01.08.2025",
        time: "11:07",
        amount: 375,
        type: "pending" as const
    },
    {
        id: "FB0801234",
        transferredFrom: "Auto Assignment",
        team: "pending",
        timeAgo: "1 hour ago",
        clientName: "Kevin Miller",
        clientId: "c43612",
        address: "147 Birch Court, Seattle, WA 98101",
        date: "01.08.2025",
        time: "10:52",
        amount: 220,
        type: "pending" as const
    },
    {
        id: "ST0801445",
        transferredFrom: "Queue System",
        team: "pending",
        timeAgo: "1.5 hours ago",
        clientName: "Amanda Taylor",
        clientId: "c36754",
        address: "258 Spruce Street, Denver, CO 80201",
        date: "01.08.2025",
        time: "10:22",
        amount: 510,
        type: "pending" as const
    },
    {
        id: "WL0801678",
        transferredFrom: "System Auto",
        team: "pending",
        timeAgo: "2 hours ago",
        clientName: "Daniel White",
        clientId: "c41987",
        address: "369 Walnut Avenue, Boston, MA 02101",
        date: "01.08.2025",
        time: "09:52",
        amount: 185,
        type: "pending" as const
    }
];

export default function BufferedOrders() {
    const [selectedType, setSelectedType] = useState<'all' | 'external' | 'internal' | 'pending'>('all');

    const filteredOrders = selectedType === 'all'
        ? mockBufferOrders
        : mockBufferOrders.filter(order => order.type === selectedType);

    const handleClaim = (orderId: string) => {
        console.log(`Claiming order: ${orderId}`);
        // Здесь будет логика для claim заказа
    };

    const typeCounts = {
        external: mockBufferOrders.filter(order => order.type === 'external').length,
        internal: mockBufferOrders.filter(order => order.type === 'internal').length,
        pending: mockBufferOrders.filter(order => order.type === 'pending').length,
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'external': return 'From Other Teams';
            case 'internal': return 'Internal Transfers';
            case 'pending': return 'Pending Orders';
            default: return 'All Orders';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'external': return '🌍';
            case 'internal': return '🔁';
            case 'pending': return '🕒';
            default: return '📋';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'external': return 'bg-indigo-500 hover:bg-indigo-600';
            case 'internal': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'pending': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-orange-500 hover:bg-orange-600';
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Buffer Orders</h1>
                <p className="text-gray-600 mb-4">Orders categorized by transfer type and processing status</p>

                {/* Stats */}
                <div className="bg-orange-100 px-4 py-2 rounded-lg inline-block">
                    <span className="text-orange-800 font-semibold">
                        {filteredOrders.length} {getTypeLabel(selectedType).toLowerCase()}
                    </span>
                </div>
            </div>

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
                    <span>📋</span>
                    All Orders ({mockBufferOrders.length})
                </button>

                <button
                    onClick={() => setSelectedType('external')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                        selectedType === 'external'
                            ? 'bg-indigo-600'
                            : 'bg-indigo-400 hover:bg-indigo-500'
                    }`}
                >
                    <span>🌍</span>
                    From Other Teams ({typeCounts.external})
                </button>

                <button
                    onClick={() => setSelectedType('internal')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                        selectedType === 'internal'
                            ? 'bg-yellow-600'
                            : 'bg-yellow-400 hover:bg-yellow-500'
                    }`}
                >
                    <span>🔁</span>
                    Internal Transfers ({typeCounts.internal})
                </button>

                <button
                    onClick={() => setSelectedType('pending')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-white flex items-center gap-2 ${
                        selectedType === 'pending'
                            ? 'bg-green-600'
                            : 'bg-green-400 hover:bg-green-500'
                    }`}
                >
                    <span>🕒</span>
                    Pending Orders ({typeCounts.pending})
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
                        clientName={order.clientName}
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
            {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">{getTypeIcon(selectedType)}</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No {getTypeLabel(selectedType).toLowerCase()}
                    </h3>
                    <p className="text-gray-500">
                        Try selecting a different category or check back later
                    </p>
                </div>
            )}
        </div>
    );
}