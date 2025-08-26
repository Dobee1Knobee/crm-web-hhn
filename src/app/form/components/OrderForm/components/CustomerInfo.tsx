// CustomerInfo.tsx - CLEAN VERSION WITHOUT DEBUG
import { AddressApproveModal } from '@/components/AddressApproveModal'
import { useOrderStore } from '@/stores/orderStore'
import Order from '@/types/formDataType'
import { Globe } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from 'react'

export default function CustomerInfo() {
    // 🏪 Подключаемся к store
    const {
        formData,
        updateFormData,

        checkDoubleOrders,
        getByLeadID,
        getCorrectCity,
        currentUser
    } = useOrderStore();

    const router = useRouter();

    // 🔍 Состояния для проверки дублей
    const [duplicateOrders, setDuplicateOrders] = useState<Order[]>([]);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
    const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null);
    const [phoneError, setPhoneError] = useState<string>('');
    
    // 🏠 Состояние для модального окна апрува адреса
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState<{
        address: string;
        zipCode: string;
        city: string;
    } | null>(null);
    const [isCheckingAddress, setIsCheckingAddress] = useState(false);
    
    // ⏰ Таймер для задержки проверки адреса
    const [addressCheckTimeout, setAddressCheckTimeout] = useState<NodeJS.Timeout | null>(null);

    // Ref для клика вне выпадающего списка
    const duplicatesRef = useRef<HTMLDivElement>(null);

    // Сбрасываем детектированный адрес при сбросе формы
    useEffect(() => {
        const unsubscribe = useOrderStore.subscribe(
            (state) => state.formData,
            (newFormData, prevFormData) => {
                // Если форма была сброшена (все поля пустые), сбрасываем детектированный адрес
                if (prevFormData && newFormData && 
                    prevFormData.address && !newFormData.address &&
                    prevFormData.phoneNumber && !newFormData.phoneNumber) {
                    setDetectedAddress(null);
                }
            }
        );

        return unsubscribe;
    }, []);

    // 🏠 Функция автоматической проверки адреса
    const checkAddress = async (address: string) => {
        if (!address.trim() || address.trim().length < 5) {
            setDetectedAddress(null);
            return;
        }

        setIsCheckingAddress(true);
        
        try {
            const addressData = await getCorrectCity(address.trim());
            
            if (addressData && addressData.address_data) {
                // ===== ЛОГИКА ОБНОВЛЕНИЯ ГОРОДА/ШТАТА =====
                // Приоритет: city > state (town не используем)
                let cityToUse = '';
                
                // Проверяем, есть ли город в ответе
                if (addressData.address_data.data.city) {
                    cityToUse = addressData.address_data.data.city;
                } 
                // Если города нет, но есть штат - проверяем совпадение
                else if (addressData.address_data.data.state) {
                    const stateName = addressData.address_data.data.state;
                    
                    // Получаем список доступных городов для команды
                    try {
                        const citiesResponse = await fetch(
                            `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getCitiesByTeam?team=${currentUser?.team}`
                        );
                        
                        if (citiesResponse.ok) {
                            const citiesData = await citiesResponse.json();
                            const availableCities = citiesData.cities || [];
                            
                            // Проверяем, есть ли совпадение state с доступными городами
                            const stateMatchesCity = availableCities.some((city: any) => 
                                city.name && city.name.toLowerCase() === stateName.toLowerCase()
                            );
                            
                            if (stateMatchesCity) {
                                cityToUse = stateName;
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching available cities:', error);
                    }
                }
                
                const detected = {
                    address: addressData.address_data.address,
                    zipCode: addressData.address_data.data.postcode,
                    city: cityToUse
                };
            
                // Устанавливаем детектированный адрес только если он отличается от текущего
                if (detected.address !== address.trim()) {
                    setDetectedAddress(detected);
                } else {
                    setDetectedAddress(null);
                }
            }
        } catch (error) {
            console.error('Error checking address:', error);
            setDetectedAddress(null);
        } finally {
            setIsCheckingAddress(false);
        }
    };

    // 🔍 Функция проверки дублей
    const handlePhoneCheck = async (phoneNumber: string) => {
        if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
            setDuplicateOrders([]);
            setShowDuplicates(false);
            return;
        }

        setIsCheckingDuplicates(true);
        setPhoneError('');

        try {
            if (typeof checkDoubleOrders !== 'function') {
                throw new Error('checkDoubleOrders is not a function');
            }

            const duplicates = await checkDoubleOrders(phoneNumber.trim());

            if (duplicates && Array.isArray(duplicates) && duplicates.length > 0) {
                setDuplicateOrders(duplicates);
                setShowDuplicates(true);
            } else {
                setDuplicateOrders([]);
                setShowDuplicates(false);
            }
        } catch (error) {
            console.error('Error checking duplicates:', error);
            setDuplicateOrders([]);
            setShowDuplicates(false);
        } finally {
            setIsCheckingDuplicates(false);
        }
    };

    // 📞 Обработчик изменения телефона
    const handlePhoneChange = (value: string) => {
        updateFormData('phoneNumber', value);

        // Очищаем предыдущий таймер
        if (checkTimeout) {
            clearTimeout(checkTimeout);
        }

        // Проверяем длину номера
        if (value.trim() && value.trim().length < 8) {
            setPhoneError('Phone number must be at least 8 characters');
            setDuplicateOrders([]);
            setShowDuplicates(false);
            return;
        } else {
            setPhoneError('');
        }

        // Проверяем условие для запуска проверки
        if (!value.trim() || value.trim().length < 8) {
            setDuplicateOrders([]);
            setShowDuplicates(false);
            return;
        }

        // Устанавливаем новый таймер для проверки дублей
        const newTimeout = setTimeout(() => {
            handlePhoneCheck(value);
        }, 500);

        setCheckTimeout(newTimeout);
    };

    // 🎯 Выбор дубля из списка
    const handleSelectDuplicate = async (leadId: string) => {
        try {
            const order = await getByLeadID(leadId);
            if (order) {
                router.push("/changeOrder");
            }
        } catch (error) {
            console.error('Error loading order:', error);
        }
    };

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

    // 🧹 Очистка таймеров при размонтировании
    useEffect(() => {
        return () => {
            if (checkTimeout) {
                clearTimeout(checkTimeout);
            }
            if (addressCheckTimeout) {
                clearTimeout(addressCheckTimeout);
            }
        };
    }, [checkTimeout, addressCheckTimeout]);

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-blue-600 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
            </div>

            <div className="space-y-4">
                {/* 📞 Телефон с проверкой дублей */}
                <div className="relative" ref={duplicatesRef}>
                    <input
                        type="text"
                        placeholder="Phone number (min 8 characters)"
                        value={formData.phoneNumber}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        name="phone_fake"
                        maxLength={20}
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.phoneNumber
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        } ${
                            duplicateOrders.length > 0 ? 'border-orange-300 bg-orange-50' :
                                phoneError ? 'border-red-300 bg-red-50' : ''
                        }`}
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
                            <span className="text-orange-500 text-sm">⚠️ {duplicateOrders.length}</span>
                        </div>
                    )}

                    {/* ❌ Индикатор ошибки */}
                    {!isCheckingDuplicates && phoneError && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-red-500 text-sm">❌</span>
                        </div>
                    )}

                    {/* ✅ Индикатор заполненности (если нет дублей и ошибок) */}
                    {!isCheckingDuplicates && formData.phoneNumber && duplicateOrders.length === 0 && !phoneError && formData.phoneNumber.trim().length >= 8 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}

                    {/* ❌ Сообщение об ошибке */}
                    {phoneError && (
                        <div className="mt-1 text-xs text-red-500">
                            {phoneError}
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
                                        Found {duplicateOrders.length} orders with this phone number
                                    </span>
                                </div>
                                <div className="text-xs text-orange-600 mt-1">
                                    Click on an order to auto-fill
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
                                                        order.text_status === 'Completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : order.text_status === 'Cancelled'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {order.text_status || 'Active'}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-700 mb-1">
                                                    👤 {order.leadName || 'No name'}
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
                                    Close list
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
                        maxLength={30}

                        value={formData.customerName}
                        onChange={(e) => updateFormData('customerName', e.target.value)}
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.customerName
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                    />

                    {/* ✅ Индикатор заполненности */}
                    {formData.customerName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}
                </div>

                {/* 🏠 Адрес - ВСЕГДА редактируемый */}
                                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Address, ZIP code"
                            maxLength={40}
                            value={formData.address}
                            onChange={(e) => {
                                updateFormData('address', e.target.value);
                                // Очищаем предыдущий детектированный адрес при изменении
                                setDetectedAddress(null);
                                
                                // Очищаем предыдущий таймер
                                if (addressCheckTimeout) {
                                    clearTimeout(addressCheckTimeout);
                                }
                                
                                // Устанавливаем новый таймер для проверки адреса через 5 секунд
                                const newTimeout = setTimeout(() => {
                                    checkAddress(e.target.value);
                                }, 2000);
                                
                                setAddressCheckTimeout(newTimeout);
                            }}
                            onBlur={() => {
                                // Если поле адреса пустое, сбрасываем детектированный адрес
                                if (!formData.address.trim()) {
                                    setDetectedAddress(null);
                                }
                            }}
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
                        
                        {/* 🔍 Индикатор детектированного адреса - ПОЯВЛЯЕТСЯ ТОЛЬКО ПОСЛЕ ДЕТЕКЦИИ И ЕСЛИ АДРЕС ОТЛИЧАЕТСЯ */}
                        {detectedAddress && 
                         detectedAddress.address !== formData.address && (
                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                <button
                                    onClick={() => setShowAddressModal(true)}
                                    className="group relative"
                                    title="Click to apply detected address for better service"
                                >
                                    <Globe className="w-4 h-4 text-blue-600 hover:text-blue-700 transition-colors" />
                                    
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        Click to apply detected address for better service
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </button>
                            </div>
                        )}
                        
                        {/* 🔄 Индикатор проверки адреса */}
                        {isCheckingAddress && (
                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
            </div>



            {/* 📊 Прогресс заполнения */}
            <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                        {[
                            formData.phoneNumber && !phoneError,
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
                                formData.phoneNumber && !phoneError,
                                formData.customerName,
                                formData.address
                            ].filter(Boolean).length / 3) * 100}%`
                        }}
                    ></div>
                </div>
            </div>
            
            {/* 🏠 Модальное окно апрува адреса */}
            {detectedAddress && (
                <AddressApproveModal
                    isOpen={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    detectedAddress={detectedAddress}
                />
            )}
        </div>
    );
}