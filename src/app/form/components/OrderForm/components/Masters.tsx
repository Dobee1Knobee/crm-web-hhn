import { useMastersByTeam } from "@/hooks/findMastersByTeam"
import { useGetSchedule } from "@/hooks/useGetSchedule"
import { useOrderStore } from "@/stores/orderStore"
import { ChevronDown, Users, Wrench } from 'lucide-react'
import MasterSchedule from './MasterSchedule'

interface Master {
    name: string;
    city: string;
}

interface MastersProps {
    team: string;
    city: string;
}

export default function Masters({ team, city }: MastersProps) {
    const masters: Master[] = useMastersByTeam(team);
    const { schedule, loading, error } = useGetSchedule();
    const {
        formData,
        updateFormData,
    } = useOrderStore();

    // Фильтруем мастеров по городу
    const filteredMasters = masters?.filter(master => master.city === city) || [];

    return (
        <div className="space-y-6">
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
                <div className="flex items-center mb-4">
                    <Wrench className="w-5 h-5 mr-2 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Masters</h2>
                    <div className="ml-2 text-sm text-gray-500 flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        ({filteredMasters.length} available)
                    </div>
                </div>

                <div className="relative">
                    <select
                        className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                        value={formData.masterName}
                        onChange={(e) => updateFormData("masterName", e.target.value)}
                    >
                        <option value="">Select a master</option>
                        {filteredMasters.length > 0 ? (
                            filteredMasters.map((master, index) => (
                                <option key={index} value={master.name}>
                                    {master.name} - {master.city}
                                </option>
                            ))
                        ) : (
                            <option value="" disabled>
                                No masters available in {city}
                            </option>
                        )}
                    </select>

                    {/* Кастомная стрелка для select */}
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Дополнительная информация о выбранном мастере */}
                {formData.masterName && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            <Wrench className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="font-medium">Selected:</span>
                            <span className="ml-1 text-gray-900">{formData.masterName}</span>
                            <span className="ml-2 text-gray-500">in {city}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Показываем расписание если выбран мастер */}
            {formData.masterName && schedule && (
                <MasterSchedule 
                    masterName={formData.masterName}
                    schedule={schedule}
                />
            )}

            {/* Показываем загрузку */}
            {loading && (
                <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-3"></div>
                        <p className="text-gray-500">Loading schedule...</p>
                    </div>
                </div>
            )}

            {/* Показываем ошибку */}
            {error && (
                <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
                    <div className="text-center py-8 text-red-500">
                        <p>Error loading schedule: {error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
