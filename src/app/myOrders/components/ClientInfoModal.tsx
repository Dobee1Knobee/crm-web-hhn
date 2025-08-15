import React from 'react'
import {AlertTriangle, User} from "lucide-react";

export type ClientInfoModalProps = {
    isOpen: boolean
    onClose: () => void
    clientName?: string
    clientPhone?: string
    clientId?: number | string
    orderId?: string
}

export default function ClientInfoModal({
                                            isOpen,
                                            onClose,
                                            clientName,
                                            clientPhone,
                                            clientId,
                                            orderId
                                        }: ClientInfoModalProps) {
    if (!isOpen) return null;

    // Форматирование client ID
    const formattedClientId = String(clientId ?? '').toString().padStart(5, '0')

    // Закрытие по клику на backdrop
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Закрытие по Escape
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            // Блокируем скролл body когда модалка открыта
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-in fade-in-0 zoom-in-95 duration-200">
                {/* Заголовок */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Информация о клиенте</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Закрыть"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Контент */}
                <div className="p-6 space-y-6">
                    {/* Заказ ID */}
                    {orderId && (
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Заказ</div>
                            <div className="text-lg font-semibold text-gray-900">ID: {orderId}</div>
                        </div>
                    )}

                    {/* Иконка клиента */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                            <User/>
                        </div>
                    </div>

                    {/* Информация о клиенте */}
                    <div className="space-y-4">
                        {/* Имя клиента */}
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Имя клиента</div>
                            <div className="text-xl font-semibold text-gray-900">
                                {clientName || 'Не указано'}
                            </div>
                        </div>

                        {/* Телефон */}
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Телефон</div>
                            <div className="text-lg font-mono text-gray-900 bg-gray-50 rounded-lg px-4 py-2">
                                {clientPhone || 'Не указан'}
                            </div>
                        </div>

                        {/* Client ID */}
                        <div className="text-center">
                            <div className="text-sm text-gray-500 mb-1">Client ID</div>
                            <div className="text-2xl font-bold text-blue-600 bg-blue-50 rounded-lg px-4 py-2 font-mono">
                                #{formattedClientId}
                            </div>
                        </div>
                    </div>

                    {/* Важное уведомление */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-amber-600 mt-0.5">
                                <AlertTriangle size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-amber-800 mb-1">Важно!</div>
                                <div className="text-sm text-amber-700 leading-relaxed">
                                    <div className="mb-2">
                                        <strong>Не передавайте номер телефона</strong> третьим лицам или в переписках.
                                    </div>
                                    <div>
                                        Для коммуникации используйте <strong>Client ID: #{formattedClientId}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Кнопки */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                    >
                        Закрыть
                    </button>
                    <button
                        onClick={() => navigator.clipboard.writeText(`#${formattedClientId}`)}
                        className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                    >
                        Скопировать Client ID
                    </button>
                </div>
            </div>
        </div>
    )
}