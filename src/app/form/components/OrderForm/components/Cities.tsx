// Cities.tsx - ИНТЕГРИРОВАННАЯ ВЕРСИЯ
import { useGetCities } from "@/hooks/useCitiesByTeam"
import { useOrderStore } from '@/stores/orderStore'
import { useEffect } from "react"

interface City {
    _id: string;
    name: string;
    timezone: string;
    team: string;
    boundingbox: number[];
    latitude: number;
    longitude: number;
    location: any;
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
        getCorrectCity
    } = useOrderStore();

    // Получаем команду из store

    // Получаем города для команды
    const { cities, loading, error } = useGetCities(team);

    // Обработка выбора города
    const handleCityClick = (cityName: string) => {
        updateFormData('city', cityName);
        // Вызываем getCorrectCity только если нужно получить дополнительную информацию
        // getCorrectCity(cityName).then((data) => {
        //     updateFormData('city', data.address_data.data.city);
        // });
    };

    // При загрузке компонента, если город не выбран - выбираем первый доступный
    // НО только если это не системно установленный город (не из AddressFitNotification)
    useEffect(() => {
        console.log('🏙️ Cities useEffect triggered:', {
            citiesLength: cities?.length,
            currentCity: formData.city,
            cities: cities?.map(c => c.name)
        });
        
        // НЕ выполняем авто-выбор, если город уже был установлен системой
        // или если это не начальное состояние
        if (cities && cities.length > 0 && !formData.city) {
            // Проверяем, не был ли город уже установлен системой
            const currentCity = formData.city;
            
            // Авто-выбор только для начального состояния или если город действительно пустой
            if (!currentCity || currentCity === cities[0].name) {
                const firstCity = cities[0] as City;
                if (firstCity && firstCity.name) {
                    console.log('🏙️ Auto-selecting first available city:', firstCity.name);
                    updateFormData('city', firstCity.name);
                }
            } else {
                console.log('🏙️ City already set, not auto-selecting:', currentCity);
            }
        }
        
        // Дополнительная проверка: если город был установлен, но не в списке доступных
        if (formData.city && cities && cities.length > 0) {
            const cityExists = cities.some((city: City) => 
                city.name && city.name.toLowerCase() === formData.city.toLowerCase()
            );
            
            if (!cityExists) {
                console.log('⚠️ Current city not in available cities list:', formData.city);
                updateFormData('city', formData.city);
                console.log('🏙️ Available cities:', cities.map(c => c.name));
            }
        }
    }, [cities, formData.city, updateFormData]);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 m-9 max-w-xl">
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-green-700">Loading cities...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl shadow-lg p-6 border border-red-200 m-9 max-w-xl">
                <div className="flex items-center">
                    <span className="text-red-600 text-lg mr-2">⚠️</span>
                    <span className="text-red-700">Error loading cities for team {team}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 m-9 max-w-xl">
            {/*  Заголовок с текущим выбором */}
            <div className="text-sm text-green-800 mb-4 font-medium flex items-center">
                <span className="mr-2">📍</span>
                We think{' '}
                <span className="font-bold mx-1 text-green-900">
                    {formData.city || cities[0]?.name}
                </span>{' '}
                fits you — tap to change

             
            </div>

            {/* Информация о команде */}
            <div className="text-xs text-green-600 mb-3 flex items-center">
                <span className="mr-1">👥</span>
                Team {team} cities ({cities?.length || 0} available)
            </div>

            {/* Сетка городов */}
            <div className="grid grid-cols-4 gap-3">
                {cities?.map((city: City, index: number) => {
                    // Проверяем, что city это объект и у него есть name
                    if (!city || typeof city !== 'object' || !city.name) {
                        console.warn('Invalid city data:', city);
                        return null;
                    }
                    
                    const cityName = city.name;
                    const isSelected = formData.city === cityName;

                    return (
                        <button
                            key={city._id || index}
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
                            {/*  Анимированный фон для выбранного */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 animate-pulse"></div>
                            )}

                            {/*  Иконка для выбранного города */}
                            <div className="relative z-10 flex items-center justify-center">
                                {isSelected && <span className="mr-1">📍</span>}
                                {cityName}
                            </div>

                        </button>
                    );
                })}
            </div>

            {/*  Дополнительная информация */}
            {formData.city && (
                <div className="mt-4 p-3 bg-white bg-opacity-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-green-700">
                            <span className="font-medium">Selected:</span> {formData.city}
                        </div>
                        <div className="text-green-600 text-xs">
                            Team {team}
                        </div>
                    </div>
                </div>
            )}

            {/* Предупреждение, если городов нет */}
            {cities?.length === 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <span className="text-red-800 text-sm">
                            No cities available for team {team}. Please contact administrator.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}