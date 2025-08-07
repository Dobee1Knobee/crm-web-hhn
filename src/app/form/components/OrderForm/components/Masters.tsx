import {useMastersByTeam} from "@/hooks/findMastersByTeam";
import {useOrderStore} from "@/stores/orderStore";

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
        isWorkingOnTelegramOrder,
        currentTelegramOrder
    } = useOrderStore();
    // Фильтруем мастеров по городу
    const filteredMasters = masters?.filter(master => master.city === city) || [];

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-xl">
            <div className="flex items-center mb-4 align-items-center">
                <h2 className="text-lg font-semibold text-gray-900"> 👷 Masters</h2>
            </div>
            <div>
                <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" onChange={(e => updateFormData("masterName",e.target.value))}>
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
            </div>
        </div>
    );
}