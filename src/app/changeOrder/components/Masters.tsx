import { useMastersByTeam } from "@/hooks/findMastersByTeam"
import { useOrderStore } from "@/stores/orderStore"
import { ChevronDown, Plus, Trash, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'

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
    const {
        formData,
        updateFormData,
    } = useOrderStore();
    useEffect(() => {
        setIsAdditionalTechVisible(Boolean(formData.masterName && formData.masterName.length > 0));
    }, [formData.masterName]);
    // Фильтруем мастеров по городу
    const filteredMasters = masters?.filter(master => master.city === city) || [];
    const [isAdditionalTechVisible, setIsAdditionalTechVisible] = useState(false);
    const [isAddingExtraTech, setIsAddingExtraTech] = useState(false);
    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4">
                <Wrench className="w-5 h-5 mr-2 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Masters</h2>
                <div className="ml-2 text-sm text-gray-500 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    ({filteredMasters.length} available)
                </div>
            </div>
            <div className='flex flex-row gap-3 items-stre'>
            <div className={`relative w-96 ${isAdditionalTechVisible ? 'w-96' : 'w-full'}`}>
                <select
                    className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                    value={formData.masterName}
                    onChange={(e) => {updateFormData("masterName", e.target.value)}}
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
            {isAdditionalTechVisible &&
            (<button className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg text-center flex flex-col items-center transition-colors duration-200 shadow-sm hover:shadow-md" onClick={() => {setIsAddingExtraTech(true); setIsAdditionalTechVisible(false)}}>       
                <Plus className="w-3 h-3" />
                <span className="text-sm font-medium ">Add master</span>
            </button>)
            }
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
            {isAddingExtraTech || (formData.additionalTechName && formData.additionalTechName.length > 0) ? (
            <div className='flex flex-row gap-3 items-stretch mt-3'>
                <div className="relative w-96">
                    <select
                        className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                        value={formData.additionalTechName}
                        onChange={(e) => {updateFormData("additionalTechName", e.target.value)}}
                    >
                        <option value="">Select a master</option>
                        {filteredMasters.length > 0 ? (
                            filteredMasters
                                .filter(master => master.name !== formData.masterName)
                                .map((master, index) => (
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
                <button 
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg text-center flex flex-col items-center transition-colors duration-200 shadow-sm hover:shadow-md" 
                    onClick={() => {
                        setIsAddingExtraTech(false);
                        updateFormData("additionalTechName", "");
                        setIsAdditionalTechVisible(true);
                    }}
                >       
                    <Trash className="w-3 h-3" />
                    <span className="text-sm font-medium">Remove</span>
                </button>
            </div>       
            ) : null}
            {formData.additionalTechName && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center text-sm text-gray-700">
                        <Wrench className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">Selected:</span>
                        <span className="ml-1 text-gray-900">{formData.additionalTechName}</span>
                        <span className="ml-2 text-gray-500">in {city}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
