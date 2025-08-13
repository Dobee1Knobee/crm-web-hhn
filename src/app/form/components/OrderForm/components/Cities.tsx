// Cities.tsx - ВЕРСИЯ С LUCIDE ИКОНКАМИ
import { useGetCities } from "@/hooks/useCitiesByTeam";
import { useOrderStore } from '@/stores/orderStore';
import { useEffect } from "react";
import {
    MapPin,
    Users,
    Smartphone,
    AlertTriangle,
    Loader2,
    Info
} from 'lucide-react';

interface City {
    name: string;
}
type CitiesProps = {
    team: string;
};

export default function Cities({ team }: CitiesProps) {
    // 🏪 Подключаемся к store
    const {
        formData,
        updateFormData,
        currentUser,
        isWorkingOnTelegramOrder
    } = useOrderStore();

    // Получаем команду из store

    // Получаем города для команды
    const { cities, loading, error } = useGetCities(team);

    // Обработка выбора города
    const handleCityClick = (cityName: string) => {
        updateFormData('city', cityName);
    };

    // При загрузке компонента, если город не выбран - выбираем первый доступный
    useEffect(() => {
        if (cities && cities.length > 0 && !formData.city) {
            const firstCity = typeof cities[0] === 'string' ? cities[0] : cities[0];
            updateFormData('city', firstCity);
        }
    }, [cities, formData.city, updateFormData]);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 m-9 max-w-xl">
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="animate-spin h-8 w-8 text-green-600" />
                    <span className="ml-3 text-green-700">Loading cities...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border border-red-200 m-9 max-w-xl">
                <div className="flex items-center">
                    <AlertTriangle className="text-red-600 w-5 h-5 mr-2" />
                    <span className="text-red-700">Error loading cities for team {team}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 m-9 max-w-xl">
            {/* 📍 Заголовок с текущим выбором */}
            <div className="text-sm text-green-800 mb-4 font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-700" />
                We think{' '}
                <span className="font-bold mx-1 text-green-900">
                    {formData.city || 'New_York'}
                </span>{' '}
                fits you — tap to change

                {/* 📱 Индикатор Telegram заказа */}
                {isWorkingOnTelegramOrder && (
                    <span className="ml-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Smartphone className="w-3 h-3 mr-1" />
                            Telegram Order
                        </span>
                    </span>
                )}
            </div>

            {/* 👥 Информация о команде */}
            <div className="text-xs text-green-600 mb-3 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Team {team} cities ({cities?.length || 0} available)
            </div>

            {/* 🏙️ Сетка городов */}
            <div className="grid grid-cols-4 gap-3">
                {cities?.map((city: City, index: number) => {
                    const cityName = typeof city === 'string' ? city : city.name || 'Unknown';
                    const isSelected = formData.city === cityName;

                    return (
                        <button
                            key={index}
                            onClick={() => handleCityClick(cityName)}
                            className={`
                                px-4 py-3 rounded-xl text-white font-semibold text-sm
                                transition-all duration-200 transform hover:scale-105 hover:shadow-md
                                relative overflow-hidden
                                ${isSelected
                                ? 'bg-green-600 hover:bg-green-700 shadow-lg ring-4 ring-green-300 ring-opacity-50'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }
                            `}
                            title={`Select ${cityName}`}
                        >
                            {/* ✨ Анимированный фон для выбранного */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 animate-pulse"></div>
                            )}

                            {/* 📍 Иконка для выбранного города */}
                            <div className="relative z-10 flex items-center justify-center">
                                {isSelected && <MapPin className="w-3 h-3 mr-1" />}
                                {cityName}
                            </div>

                        </button>
                    );
                })}
            </div>

            {/* 📊 Дополнительная информация */}
            {formData.city && (
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-green-700 flex items-center">
                            <Info className="w-4 h-4 mr-1" />
                            <span className="font-medium">Selected:</span>
                            <span className="ml-1">{formData.city}</span>
                        </div>
                        <div className="text-green-600 text-xs flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            Team {team}
                        </div>
                    </div>
                </div>
            )}

            {/* ⚠️ Предупреждение, если городов нет */}
            {cities?.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-yellow-800 text-sm">
                            No cities available for team {team}. Please contact administrator.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}