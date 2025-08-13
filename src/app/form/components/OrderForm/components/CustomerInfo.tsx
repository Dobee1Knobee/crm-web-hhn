// CustomerInfo.tsx - ВЕРСИЯ С ПРОВЕРКОЙ ДУБЛЕЙ
import { useOrderStore } from '@/stores/orderStore';
import { useState, useEffect, useRef } from 'react';
import Order from '@/types/formDataType';
import {useRouter} from "next/navigation";

export default function CustomerInfo() {
    // 🏪 Подключаемся к store
    const {
        formData,
        updateFormData,
        isWorkingOnTelegramOrder,
        currentTelegramOrder,
        checkDoubleOrders,
        getByLeadID// добавляем функцию проверки дублей
    } = useOrderStore();
    const router = useRouter();
    // 🔍 Состояния для проверки дублей
    const [duplicateOrders, setDuplicateOrders] = useState<Order[]>([]);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);

    // Ref для клика вне выпадающего списка
    const duplicatesRef = useRef<HTMLDivElement>(null);

    // 🔍 Функция проверки дублей с debounce
    const handlePhoneCheck = async (phoneNumber: string) => {
        if (!phoneNumber.trim() || phoneNumber.length < 8) {
            setDuplicateOrders([]);
            setShowDuplicates(false);
            return;
        }

        setIsCheckingDuplicates(true);

        try {
            const duplicates = await checkDoubleOrders(phoneNumber.trim());

            if (duplicates && duplicates.length > 0) {
                setDuplicateOrders(duplicates);
                setShowDuplicates(true);
                console.log(`🔍 Найдено ${duplicates.length} заказов с номером ${phoneNumber}`);
            } else {
                setDuplicateOrders([]);
                setShowDuplicates(false);
            }
        } catch (error) {
            console.error('Ошибка при проверке дублей:', error);
            setDuplicateOrders([]);
            setShowDuplicates(false);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    // 📞 Обработчик изменения телефона с debounce
    const handlePhoneChange = (value: string) => {
        updateFormData('phoneNumber', value);

        // Очищаем предыдущий таймер
        if (checkTimeout) {
            clearTimeout(checkTimeout);
        }

        // Устанавливаем новый таймер для проверки дублей через 1 секунду
        const newTimeout = setTimeout(() => {
            handlePhoneCheck(value);
        }, 1000);

        setCheckTimeout(newTimeout);
    };
    const updateOrder = useOrderStore(state => state.getByLeadID);

    // 🎯 Выбор дубля из списка
    const handleSelectDuplicate = async (leadId: string) => {
        console.log(leadId)
        const order = await updateOrder(leadId);

        if (order) {
            console.log("Заказ найден:", order);
            router.push("/changeOrder")
            // здесь можно положить в state, отобразить в форме и т.п.
        } else {
            console.warn("Заказ не найден");
        }
    }

    // 🚫 Закрытие списка при клике вне
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (duplicatesRef.current && !duplicatesRef.current.contains(event.target as Node)) {
                setShowDuplicates(false);
            }
        };

        if (showDuplicates) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDuplicates]);

    // 🧹 Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (checkTimeout) {
                clearTimeout(checkTimeout);
            }
        };
    }, [checkTimeout]);

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-blue-600 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>

                {/* 📱 Индикатор Telegram заказа */}
                {isWorkingOnTelegramOrder && currentTelegramOrder && (
                    <div className="ml-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📱 From Telegram
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {/* 📞 Телефон с проверкой дублей */}
                <div className="relative" ref={duplicatesRef}>
                    <input
                        type="text"
                        placeholder="Phone number"
                        value={formData.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        name="phone_fake"
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.phoneNumber
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        } ${
                            isWorkingOnTelegramOrder && formData.phoneNumber
                                ? 'bg-blue-50 border-blue-200'
                                : ''
                        } ${
                            duplicateOrders.length > 0 ? 'border-orange-300 bg-orange-50' : ''
                        }`}
                        disabled={isWorkingOnTelegramOrder}
                    />

                    {/* 🔄 Индикатор загрузки */}
                    {isCheckingDuplicates && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {/* ⚠️ Индикатор дублей */}
                    {!isCheckingDuplicates && duplicateOrders.length > 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-orange-500 text-sm">⚠️</span>
                        </div>
                    )}

                    {/* ✅ Индикатор заполненности (если нет дублей) */}
                    {!isCheckingDuplicates && formData.phoneNumber && duplicateOrders.length === 0 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}

                    {/* 📱 Telegram индикатор */}
                    {isWorkingOnTelegramOrder && formData.phoneNumber && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-blue-500 text-sm">📱</span>
                        </div>
                    )}

                    {/* 📋 Выпадающий список дублей */}
                    {showDuplicates && duplicateOrders.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-orange-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                            {/* Заголовок */}
                            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-orange-600">⚠️</span>
                                    <span className="text-sm font-medium text-orange-800">
                                        Найдено {duplicateOrders.length} заказов с этим номером
                                    </span>
                                </div>
                                <div className="text-xs text-orange-600 mt-1">
                                    Нажмите на заказ для автозаполнения
                                </div>
                            </div>

                            {/* Список заказов */}
                            <div className="max-h-60 overflow-y-auto">
                                {duplicateOrders.map((order, index) => (
                                    <div
                                        key={order.order_id || index}
                                        onClick={() => handleSelectDuplicate(order.order_id)}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        ID: {order.order_id}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        order.text_status === 'Завершен'
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.text_status === 'Отменен'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {order.text_status || 'Оформлен'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 mb-1">
                                                    👤 {order.leadName || 'Без имени'}
                                                </div>
                                                {order.address && (
                                                    <div className="text-xs text-gray-500 truncate">
                                                        📍 {order.address}
                                                    </div>
                                                )}
                                                {order.date && (
                                                    <div className="text-xs text-gray-500">
                                                        📅 {order.date}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right ml-3">
                                                {order.total && (
                                                    <div className="text-sm font-medium text-gray-900">
                                                        ${order.total}
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-500">
                                                    Client #{String(order.client_id || '').padStart(5, '0')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Кнопка закрытия */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <button
                                    onClick={() => setShowDuplicates(false)}
                                    className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    Закрыть список
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 👤 Имя клиента */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Customer Name"
                        value={formData.customerName}
                        onChange={(e) => updateFormData('customerName', e.target.value)}
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.customerName
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        } ${
                            isWorkingOnTelegramOrder && formData.customerName
                                ? 'bg-blue-50 border-blue-200'
                                : ''
                        }`}
                        disabled={isWorkingOnTelegramOrder}
                    />

                    {/* ✅ Индикатор заполненности */}
                    {formData.customerName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}

                    {/* 📱 Telegram индикатор */}
                    {isWorkingOnTelegramOrder && formData.customerName && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-blue-500 text-sm">📱</span>
                        </div>
                    )}
                </div>

                {/* 🏠 Адрес - ВСЕГДА редактируемый */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Address, ZIP code"
                        value={formData.address}
                        onChange={(e) => updateFormData('address', e.target.value)}
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.address
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                    />

                    {/* ✅ Индикатор заполненности */}
                    {formData.address && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 📱 Показываем исходное сообщение клиента из Telegram */}
            {isWorkingOnTelegramOrder && currentTelegramOrder && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center mb-2">
                        <span className="text-blue-600 text-sm font-medium">📱 Original Telegram Message:</span>
                    </div>
                    <div className="text-sm text-blue-800 bg-white p-3 rounded-lg border border-blue-200">
                        {currentTelegramOrder.customerMessage}
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                        Accepted at: {new Date(currentTelegramOrder.acceptedAt).toLocaleString()}
                    </div>
                </div>
            )}

            {/* 📊 Прогресс заполнения */}
            <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                        {[
                            formData.phoneNumber,
                            formData.customerName,
                            formData.address
                        ].filter(Boolean).length}/3 completed
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                            width: `${([
                                formData.phoneNumber,
                                formData.customerName,
                                formData.address
                            ].filter(Boolean).length / 3) * 100}%`
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}