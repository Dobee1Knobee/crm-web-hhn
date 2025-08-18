import { FileText, MapPin, User } from 'lucide-react'

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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
         

            {/* Customer Info */}
            <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-800">
                        {order.name || 'No name'}
                    </span>
                </div>
                
            
                
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-600" />
                    <span className="text-sm text-gray-700">
                        {order.city}, {order.state}
                    </span>
                </div>
            </div>

            {/* Order Details */}
            <div className="border-t border-blue-200 pt-3">
                <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-800">Order Details</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
               
                    
                    <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="ml-1 text-gray-800 font-medium">
                            {order.text.size || 'N/A'}
                        </span>
                    </div>
                    
                    <div>
                        <span className="text-gray-600">Mount:</span>
                        <span className="ml-1 text-gray-800 font-medium">
                            {order.text.mountType || 'N/A'}
                        </span>
                    </div>
                    
                    <div>
                        <span className="text-gray-600">Surface:</span>
												<span className="ml-1 text-gray-800 font-medium break-words">
												{order.text.surfaceType || 'N/A'}
										</span>
                    </div>
                </div>
                
                {(order.text.wires || order.text.addons) && (
                    <div className="mt-2 pt-2 border-t border-blue-100">
                        {order.text.wires && (
                            <div className="text-xs">
                                <span className="text-gray-600">Wires:</span>
                                <span className="ml-1 text-gray-800">{order.text.wires}</span>
                            </div>
                        )}
                        {order.text.addons && (
                            <div className="text-xs">
                                <span className="text-gray-600">Addons:</span>
                                <span className="ml-1 text-gray-800">{order.text.addons}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
						<div className='flex justify-between items-center pt-3 border-t border-blue-200'>
								<button
									onClick={() => onTakeToWork(order.telephone)}
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
								>
									Process 
								</button>
						</div>
        </div>
    );
}