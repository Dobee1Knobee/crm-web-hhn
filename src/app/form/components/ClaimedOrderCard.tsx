import { Clock, FileText, MapPin, User } from 'lucide-react'

interface NoteOfClaimedOrder {
    telephone: string;
    name: string;
    text: {
        size: string;
        mountType: string;
        surfaceType: string;
        wires: string;
        addons: string;
    };
    city: string;
    state: string;
}

interface ClaimedOrderCardProps {
    order: NoteOfClaimedOrder;
    onTakeToWork: (orderId: string) => void;
}

export default function ClaimedOrderCard({ order, onTakeToWork }: ClaimedOrderCardProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300">
            {/* Header with customer info */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <User size={13} className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 truncate">
                            {order.name || 'No name'}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">
                            {order.city}, {order.state}
                        </span>
                    </div>
                </div>
            </div>

            {/* Order Details - Compact but beautiful */}
            <div className="bg-white/60 rounded border border-blue-100 p-2 mb-2">
                <div className="flex items-center gap-1.5 mb-2">
                    <FileText size={13} className="text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-semibold text-blue-800">Order Details</span>
                </div>
                
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Size:</span>
                        <span className="text-gray-800 font-semibold text-right max-w-40 truncate bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                            {order.text.size || 'N/A'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Mount:</span>
                        <span className="text-gray-800 font-semibold text-right max-w-36 truncate bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                            {order.text.mountType || 'N/A'}
                        </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Surface:</span>
                        <span className="text-gray-800 font-semibold text-right max-w-36 truncate bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                            {order.text.surfaceType || 'N/A'}
                        </span>
                    </div>
                </div>
                
                {/* Additional details if available */}
                {(order.text.wires || order.text.addons) && (
                    <div className="mt-2 pt-2 border-t border-blue-100 space-y-1.5">
                        {order.text.wires && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Wires:</span>
                                <span className="text-gray-800 font-semibold text-right max-w-36 truncate bg-green-50 px-1.5 py-0.5 rounded text-xs">{order.text.wires}</span>
                            </div>
                        )}
                        {order.text.addons && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Addons:</span>
                                <span className="text-gray-800 font-semibold text-right max-w-36 truncate bg-purple-50 px-1.5 py-0.5 rounded text-xs">{order.text.addons}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Action Button - Compact but beautiful */}
            <div className='pt-1.5 border-t border-blue-200'>
                <button
                    onClick={() => onTakeToWork(order.telephone)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 py-2 rounded text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
                >
                    <Clock size={13} />
                    Process Order
             
                </button>
            </div>
        </div>
    )
}
