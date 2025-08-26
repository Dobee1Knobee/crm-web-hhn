// CustomerInfo.tsx - ИНТЕГРИРОВАННАЯ ВЕРСИЯ
import { useOrderStore } from '@/stores/orderStore'

export default function CustomerInfo() {
    // 🏪 Подключаемся к store
    const {
        formData,
        updateFormData,
    
    } = useOrderStore();
    
    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <span className="h-3 w-3 bg-blue-600 rounded-full mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>           
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Phone number"
                        value={formData.phoneNumber}
                        onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                        name="phone_fake"
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none transition focus:ring duration-300 ease-in-out focus:ring-blue-400 ${
                            formData.phoneNumber
                                ? 'bg-white text-gray-900'
                                : 'bg-gray-50 text-gray-500'
                        }`}
                    />

                    {/* Индикатор заполненности */}
                    {formData.phoneNumber && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}

                    {/* 📱 Telegram индикатор */}
                    
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
                        } `}
                    />

                    {/* Индикатор заполненности */}
                    {formData.customerName && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}

                   
                </div>

                {/*  Адрес - ВСЕГДА редактируемый */}
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

                    {/*  Индикатор заполненности */}
                    {formData.address && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-500">✓</span>
                        </div>
                    )}
                </div>

            </div>

          

            {/* Прогресс заполнения */}
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