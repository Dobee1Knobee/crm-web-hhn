"use client"
import { useOrderStore } from '@/stores/orderStore'
import { AlertTriangle, ArrowRight, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

export const AddressFitNotification: React.FC = () => {
    const { 
        addressFitNotification, 
        hideAddressFitNotification, 
        transferOrderToBuffer,
        formData,
        createOrder,
        getCorrectCity,
        updateFormData,
        currentUser,
        selectedServices
    } = useOrderStore();
    const [isTransferring, setIsTransferring] = useState(false);
    const router = useRouter();

    if (!addressFitNotification?.isVisible) {
        return null;
    }

    const handleTransferToBuffer = async () => {
        if (!addressFitNotification) return;
        
        setIsTransferring(true);
        try {
            // Получаем orderId из уведомления
            const orderId = addressFitNotification.orderId;
            
            if (!orderId) {
                toast.error('Failed to determine order ID for transfer');
                return;
            }
            
            await transferOrderToBuffer(orderId, addressFitNotification.nearestTeam, 
                `Automatic transfer: address doesn't match team ${addressFitNotification.nearestTeam}`);
            
            toast.success(`Order transferred to ${addressFitNotification.nearestTeam} team buffer`);
            hideAddressFitNotification();
        } catch (error) {
            console.error('Error transferring order:', error);
            toast.error('Failed to transfer order to buffer');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleCreateAndTransferOrder = async () => {
        console.log('🚀 handleCreateAndTransferOrder started');
        
        if (!addressFitNotification) {
            console.log('❌ No addressFitNotification');
            return;
        }
        
        // Проверяем аутентификацию пользователя
        if (!currentUser?.userAt) {
            console.log('❌ User not authenticated');
            toast.error('User not authenticated. Please log in again.');
            return;
        }
        
        // Проверяем наличие номера телефона
        if (!formData.phoneNumber) {
            console.log('❌ No phone number');
            toast.error('Phone number is required to create and transfer order');
            return;
        }
        
        console.log('✅ All checks passed, starting address processing...');
        setIsTransferring(true);
        try {
            console.log('🔍 Starting address processing for:', formData.address);
            
            // Обновляем formData с детектированными данными (город и ZIP, но НЕ адрес)
            // Получаем детектированные данные из API ответа
            const addressData = await getCorrectCity(formData.address);
            
            if (addressData && addressData.address_data) {
                // ===== ЛОГИКА ОБНОВЛЕНИЯ ГОРОДА/ШТАТА =====
                // Приоритет: city > town > state (с проверкой совпадения)
                let cityToUse = '';
                let shouldShowManualSelection = false;
                
                console.log('🔍 Address data received:', {
                    city: addressData.address_data.data.city,
                    state: addressData.address_data.data.state,
                    postcode: addressData.address_data.data.postcode,
                    nearestTeam: addressFitNotification.nearestTeam
                });
                
                // Проверяем, есть ли город в ответе (приоритет: city > state, town не используем)
                if (addressData.address_data.data.city) {
                    cityToUse = addressData.address_data.data.city;
                    console.log('✅ Using city from API:', cityToUse);
                } 
                // Если города нет, но есть штат - проверяем совпадение
                else if (addressData.address_data.data.state) {
                    const stateName = addressData.address_data.data.state;
                    console.log('🔍 Checking if state matches available cities:', stateName);
                    
                    // Получаем список доступных городов для команды
                    try {
                        console.log(`🔍 Fetching available cities for team: ${addressFitNotification.nearestTeam}`);
                        const citiesResponse = await fetch(
                            `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getCitiesByTeam?team=${addressFitNotification.nearestTeam}`
                        );
                        
                        if (citiesResponse.ok) {
                            const citiesData = await citiesResponse.json();
                            const availableCities = citiesData.cities || [];
                            
                            console.log('🏙️ Available cities for team:', availableCities.map((c: any) => c.name));
                            console.log(`🔍 Comparing state "${stateName}" with available cities...`);
                            
                            // Проверяем, есть ли совпадение state с доступными городами
                            const stateMatchesCity = availableCities.some((city: any) => {
                                const cityName = city.name?.toLowerCase();
                                const stateNameLower = stateName.toLowerCase();
                                const matches = cityName === stateNameLower;
                                console.log(`  ${cityName} === ${stateNameLower} ? ${matches}`);
                                return matches;
                            });
                            
                            if (stateMatchesCity) {
                                cityToUse = stateName;
                                console.log('✅ State matches available city, using state:', cityToUse);
                            } else {
                                console.log('❌ State does not match any available city');
                                shouldShowManualSelection = true;
                            }
                        } else {
                            console.log('❌ Failed to fetch available cities:', citiesResponse.status);
                            shouldShowManualSelection = true;
                        }
                    } catch (error) {
                        console.error('❌ Error fetching available cities:', error);
                        shouldShowManualSelection = true;
                    }
                }
                
                // Обновляем данные только если у нас есть что обновлять
                if (cityToUse) {
                    console.log('🔄 Before update - Current formData.city:', formData.city);
                    updateFormData('city', cityToUse);
                    updateFormData('zipCode', addressData.address_data.data.postcode || '');
                    updateFormData('teamId', currentUser?.team);
                    updateFormData('text_status', 'Другой регион');
                    console.log('✅ Updated form data with:', { 
                        city: cityToUse, 
                        team: addressFitNotification.nearestTeam,
                        zipCode: addressData.address_data.data.postcode 
                    });
                } else if (shouldShowManualSelection) {
                    console.log('❌ No suitable city found, showing manual selection message');
                    toast.error(`City not detected automatically. 
                        State "${addressData.address_data.data.state}" doesn't match available cities for team ${addressFitNotification.nearestTeam}. 
                        Please select city manually.`);
                    // Здесь можно добавить логику для показа модального окна выбора города
                    setIsTransferring(false);
                    return; // Прерываем создание заказа
                } else {
                    console.log('❌ No city, town, or state found, keeping original form data unchanged');
                    console.log('🔍 Available data fields:', {
                        city: addressData.address_data.data.city,
                        town: addressData.address_data.data.town,
                        state: addressData.address_data.data.state
                    });
                }
                
                // Создаем заказ (он будет использовать обновленный formData)
                if (!currentUser?.userAt) {
                    throw new Error('User not authenticated');
                }
                const newOrder = await createOrder(currentUser.userAt);
                
                if (newOrder) {
                    // Получаем правильный ID заказа для передачи
                    const orderId = newOrder.leadId || newOrder._id || newOrder.order_id;
                    
                    if (!orderId) {
                        console.error('Order created but no ID found:', newOrder);
                        toast.error('Order created but failed to get ID for transfer');
                        return;
                    }
                    
                    console.log('Created order:', newOrder);
                    console.log('Using order ID for transfer:', orderId);
                    
                    // Сразу передаем заказ в буфер
                    await transferOrderToBuffer(orderId, addressFitNotification.nearestTeam, 
                        `Automatic transfer: address doesn't match current team`);
                    
                    toast.success(`Order created and transferred to ${addressFitNotification.nearestTeam} team buffer`);
                    hideAddressFitNotification();
                    
                    // Переходим на страницу myOrders
                    router.push('/myOrders');
                }
            } else {
                throw new Error('Failed to get address data');
            }
        } catch (error) {
            console.error('Error creating and transferring order:', error);
            toast.error('Failed to create and transfer order');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-yellow-800">
                            Address doesn't match your team
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p className="mb-2">{addressFitNotification.message}</p>
                            <p className="text-xs text-yellow-600">
                                Address: {addressFitNotification.address}
                            </p>
                        </div>
                        <div className="mt-3 flex space-x-2">
                            {addressFitNotification.orderId ? (
                                <button
                                    onClick={handleTransferToBuffer}
                                    disabled={isTransferring}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTransferring ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 mr-1" />
                                    )}
                                    {isTransferring ? 'Transferring...' : 'Transfer to Buffer'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        // Создание заказа и отправка в буфер
                                        handleCreateAndTransferOrder();
                                    }}
                                    disabled={!formData.phoneNumber}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-800 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowRight className="h-4 w-4 mr-1" />
                                    Transfer Order
                                    {!formData.phoneNumber && (
                                        <span className="ml-1 text-xs text-blue-600">(Phone required)</span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={hideAddressFitNotification}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-600 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <button
                            onClick={hideAddressFitNotification}
                            className="inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
