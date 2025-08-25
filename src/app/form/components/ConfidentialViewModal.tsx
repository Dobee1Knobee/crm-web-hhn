import { useEffect } from 'react'

interface ConfidentialViewModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    orderInfo: {
        order_id?: string;
        owner?: string;
        leadName?: string;
        text_status?: string;
    };
}

export default function ConfidentialViewModal({
    isOpen,
    onConfirm,
    onCancel,
    
    orderInfo
}: ConfidentialViewModalProps) {
    // Закрытие по Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto animate-in fade-in-0 zoom-in-95 duration-200">

                {/* Заголовок с предупреждением */}
                <div className="bg-red-50 border-b border-red-200 p-6 rounded-t-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-2xl">🔒</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-red-800">Confidential Order Access</h2>
                            <p className="text-sm text-red-600">This order belongs to another user</p>
                        </div>
                    </div>
                </div>

                {/* Информация о заказе */}
                {orderInfo && (
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Order ID:</span>
                                <div className="font-mono font-semibold">{orderInfo.order_id}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Owner:</span>
                                <div className="font-semibold text-blue-600">{orderInfo.owner}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Customer:</span>
                                <div className="font-semibold">{orderInfo.leadName || 'N/A'}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <div className="font-semibold">{orderInfo.text_status || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Предупреждения */}
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-yellow-600 text-lg">⚠️</span>
                                <div>
                                    <div className="font-semibold text-yellow-800 mb-1">
                                        Confidentiality Notice
                                    </div>
                                    <div className="text-sm text-yellow-700">
                                        All customer data in this order is <strong>strictly confidential</strong>.
                                        Do not share, copy, or discuss this information with unauthorized personnel.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-blue-600 text-lg">📝</span>
                                <div>
                                    <div className="font-semibold text-blue-800 mb-1">
                                        Activity Logging
                                    </div>
                                    <div className="text-sm text-blue-700">
                                        Your access to this order will be <strong>logged and recorded</strong>.
                                        All changes you make will be tracked with your user ID and timestamp.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <span className="text-orange-600 text-lg">👁️</span>
                                <div>
                                    <div className="font-semibold text-orange-800 mb-1">
                                        View Recording
                                    </div>
                                    <div className="text-sm text-orange-700">
                                        The fact that you viewed this order will be permanently recorded
                                        in the system audit log.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Чекбокс подтверждения */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                id="confidential-agreement"
                            />
                            <span className="text-sm text-gray-700">
                                I understand and agree to the confidentiality terms.
                                I acknowledge that my access will be logged and I will handle
                                all information responsibly.
                            </span>
                        </label>
                    </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            const checkbox = document.getElementById('confidential-agreement') as HTMLInputElement;
                            if (checkbox?.checked) {
                                onConfirm();
                            } else {
                                alert('Please confirm that you agree to the confidentiality terms.');
                            }
                        }}
                        className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                    >
                        Access Order
                    </button>
                </div>
            </div>
        </div>
    );
}