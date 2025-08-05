import { useGetCities } from "@/hooks/useCitiesByTeam";
import { useState } from "react";

interface Props {
    team: string;
}
interface City {
    name:string;
}
export default function Cities({ team }: Props) {
    const { cities, loading, error } = useGetCities(team);
    const [selectedCity, setSelectedCity] = useState('LA');

    const handleCityClick = (city: string) => {
        setSelectedCity(city);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error loading cities</p>;

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border border-green-200 m-9 max-w-xl">
            <div className="text-sm text-green-800 mb-4 font-medium flex items-center">
                <span className="mr-2">📍</span>
                We think <span className="font-bold mx-1">{selectedCity}</span> fits you — tap to change
            </div>

            <div className="grid grid-cols-4 gap-3">
                {cities.map((city: City, index: number) => {
                    const cityName = typeof city === 'string' ? city : city.name || 'Unknown';
                    const isSelected = selectedCity === cityName;

                    return (
                        <button
                            key={index}
                            onClick={() => handleCityClick(cityName)}
                            className={`
                               px-4 py-3 rounded-xl text-white font-semibold text-sm
                               transition-all duration-200 transform hover:scale-105 hover:shadow-md
                               ${isSelected
                                ? 'bg-green-600 hover:bg-green-700 shadow-lg ring-4 ring-green-300 ring-opacity-50'
                                : 'bg-blue-500 hover:bg-blue-600'
                            }
                           `}
                        >
                            {cityName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}