import { useMastersByTeam } from "@/hooks/findMastersByTeam"
import { useGetSchedule } from '@/hooks/useGetSchedule'
import { useOrderStore } from "@/stores/orderStore"
import { ChevronDown, Plus, Trash, Users, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import MasterSchedule from '../../form/components/OrderForm/components/MasterSchedule'

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
    const [showingSchedule, setShowingSchedule] = useState(false);
    const {
        formData,
        updateFormData,
    } = useOrderStore();
    
    useEffect(() => {
        setIsAdditionalTechVisible(Boolean(formData.masterName && formData.masterName.length > 0));
    }, [formData.masterName]);
    
    const filteredMasters = masters?.filter(master => master.city === city) || [];
    const [isAdditionalTechVisible, setIsAdditionalTechVisible] = useState(false);
    const [isAddingExtraTech, setIsAddingExtraTech] = useState(false);
    
    const [firstMasterSelectedSlots, setFirstMasterSelectedSlots] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (formData.additionalTechName && !isAddingExtraTech) {
            console.log('Auto-selecting additional tech from formData:', formData.additionalTechName);
            setIsAddingExtraTech(true);
            setIsAdditionalTechVisible(true);
        }
    }, [formData.additionalTechName, isAddingExtraTech]);

    useEffect(() => {
        if (formData.dateSlots && formData.dateSlots.length > 0 && firstMasterSelectedSlots.size === 0) {
            const slotsToSelect = new Set<string>();
            
            // Обрабатываем dateSlots - может быть массивом или строкой
            let slotsArray: string[] = [];
            
            if (Array.isArray(formData.dateSlots)) {
                // Если это массив, обрабатываем каждый элемент
                formData.dateSlots.forEach((item: any) => {
                    if (typeof item === 'string') {
                        // Если элемент содержит запятые, разбиваем его
                        if (item.includes(',')) {
                            slotsArray.push(...item.split(',').filter((slot: string) => slot.trim().length > 0));
                        } else {
                            slotsArray.push(item);
                        }
                    }
                });
            } else if (typeof formData.dateSlots === 'string') {
                // Если это строка, разбиваем по запятой
                const slotsString = formData.dateSlots as string;
                if (slotsString.length > 0) {
                    slotsArray = slotsString.split(',').filter((slot: string) => slot.trim().length > 0);
                }
            }
            
            console.log('Parsed slots array:', slotsArray);
            
            // Теперь обрабатываем разбитые слоты
            slotsArray.forEach(slot => {
                if (slot.startsWith(formData.masterName)) {
                    slotsToSelect.add(slot);
                }
            });
            
            if (slotsToSelect.size > 0) {
                console.log('Auto-selecting first master slots from formData:', Array.from(slotsToSelect));
                setFirstMasterSelectedSlots(slotsToSelect);
            }
        }
    }, [formData.dateSlots, formData.masterName, firstMasterSelectedSlots.size]);

    useEffect(() => {
        if (formData.additionalTechSlots && formData.additionalTechSlots.length > 0) {
            console.log('Auto-setting additionalTechSlots from formData:', formData.additionalTechSlots);
        }
    }, [formData.additionalTechSlots]);
    
    useEffect(() => {
    
        if (formData.date && firstMasterSelectedSlots.size > 0) {
            console.log('Date changed by user, clearing selected slots and additional master');
            setFirstMasterSelectedSlots(new Set());
            updateFormData("additionalTechName", "");
            updateFormData("additionalTechSlots", "");
            setIsAddingExtraTech(false);
            setIsAdditionalTechVisible(Boolean(formData.masterName && formData.masterName.length > 0));
        }
    }, [formData.date]);
    
    // Автоматически записываем слоты дополнительного техника в formData
    useEffect(() => {
        if (formData.additionalTechName && firstMasterSelectedSlots.size > 0 && schedule) {
            const targetDate = formData.date || new Date().toISOString().split('T')[0];
            
            // Создаем слоты для дополнительного техника на основе выбранных слотов первого мастера
            const additionalTechSlots = Array.from(firstMasterSelectedSlots).map(slot => {
                const parts = slot.split('-');
                const masterName = parts[0];
                const date = parts[1];
                const hour = parts[4];
                const amPM = parts[5];
                
                // Создаем ключ для дополнительного техника
                return `${formData.additionalTechName}-${date}-${hour}-${amPM}`;
            });
            
            // Записываем слоты дополнительного техника в formData
            const slotsString = additionalTechSlots.join(',');
            console.log('Setting additional tech slots:', slotsString);
            updateFormData("additionalTechSlots", slotsString);
        } else if (!formData.additionalTechName) {
            // Если дополнительный техник убран, очищаем его слоты
            updateFormData("additionalTechSlots", "");
        }
    }, [formData.additionalTechName, firstMasterSelectedSlots, schedule, formData.date]);
    
    // Функция для проверки доступности мастера как дополнительного на основе выбранных слотов
    const isMasterAvailableAsAdditional = (masterName: string) => {
        if (!schedule || !formData.masterName || firstMasterSelectedSlots.size === 0) return false;
        
        // Проверяем, что у мастера есть расписание
        const masterSchedule = schedule.find((item: any) => item && item.master_name === masterName);
        if (!masterSchedule || !masterSchedule.schedule) return false;
        
        const targetDate = formData.date || new Date().toISOString().split('T')[0];
        const secondMasterSlots = masterSchedule.schedule[targetDate] || [];
        
        // Получаем выбранные слоты первого мастера (время)
        const selectedTimeSlots = Array.from(firstMasterSelectedSlots).map(slot => {
            const parts = slot.split('-');
            return `${parts[4]}-${parts[5]}`; // hour-AM/PM
        });
        
        // Проверяем, что у второго мастера есть доступные слоты в то же время
        const secondMasterAvailableSlots = secondMasterSlots
            .filter((slot: { busy: boolean; hour: number; amPM: string }) => !slot.busy)
            .map((slot: { busy: boolean; hour: number; amPM: string }) => `${slot.hour}-${slot.amPM}`);
        
        // Проверяем, что все выбранные слоты доступны у второго мастера
        const allSlotsAvailable = selectedTimeSlots.every(timeSlot => 
            secondMasterAvailableSlots.includes(timeSlot)
        );
        
        return allSlotsAvailable;
    };
    
    // Фильтруем мастеров, которые могут быть дополнительными
    const availableAdditionalMasters = filteredMasters.filter(master => 
        master.name !== formData.masterName && isMasterAvailableAsAdditional(master.name)
    );
    
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
                <div className='flex flex-row gap-3 items-stre'>
                <div className={`relative w-96 ${isAdditionalTechVisible ? 'w-96' : 'w-full'}`}>
                    <select
                        className="w-full p-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none bg-white"
                        value={formData.masterName}
                        onChange={(e) => {updateFormData("masterName", e.target.value);setShowingSchedule(true);setFirstMasterSelectedSlots(new Set())}}
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
                            {availableAdditionalMasters.length > 0 ? (
                                availableAdditionalMasters.map((master, index) => (
                                    <option key={index} value={master.name}>
                                        {master.name} - {master.city} ✅ Available
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>
                                    No compatible masters available
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

            {/* Показываем расписание если выбран мастер */}
            {formData.masterName && schedule && (
                <MasterSchedule 
                    masterName={formData.masterName}
                    selectedDate={formData.date}
                    schedule={schedule}
                    onSlotsChange={setFirstMasterSelectedSlots}
                />
            )}
            

            
            {/* Показываем информацию о совместимости или предупреждение */}
            {formData.masterName && formData.additionalTechName && schedule && firstMasterSelectedSlots.size > 0 && (
                <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
                    <div className="flex items-center mb-4">
                        <Users className="w-5 h-5 mr-2 text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-900">Team Compatibility</h2>
                    </div>
                    
                    {isMasterAvailableAsAdditional(formData.additionalTechName) ? (
                        // Мастера совместимы
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-bold text-green-900 mb-2">Success! Compatible Schedules</h3>
                            <p className="text-green-800">
                                ✅ <strong>{formData.masterName}</strong> and <strong>{formData.additionalTechName}</strong> 
                                have compatible schedules for {formData.date || 'the selected date'}.
                            </p>
                            <p className="text-sm text-green-700 mt-2">
                                Both masters have available time slots that overlap, ensuring they can work together.
                            </p>
                            <div className="mt-3 p-3 bg-white rounded border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-2">Selected time slots:</p>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(firstMasterSelectedSlots).map((slot, index) => {
                                        const parts = slot.split('-');
                                        const time = `${parts[4]}-${parts[5]}`;
                                        return (
                                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                {time}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Мастера несовместимы - нужно изменить время или мастера
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h3 className="font-bold text-red-900 mb-2">Warning! Incompatible Schedules</h3>
                            <div className="mt-3 p-3 bg-white rounded border border-red-200">
                                <p className="text-sm font-medium text-red-800 mb-2">Selected time slots:</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {Array.from(firstMasterSelectedSlots).map((slot, index) => {
                                        const parts = slot.split('-');
                                        const time = `${parts[4]}-${parts[5]}`;
                                        return (
                                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                {time}
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm mb-2">
                                        <strong>⚠️ Incompatible with {formData.additionalTechName}</strong>
                                    </p>
                                    <p className="text-sm text-yellow-700 mb-2">
                                        The selected time slots are not available for {formData.additionalTechName}.
                                    </p>
                                    <p className="text-yellow-800 text-sm">
                                        <strong>To fix this:</strong>
                                    </p>
                                    <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                                        <li>• Change the selected time slots to match {formData.additionalTechName}'s availability, OR</li>
                                        <li>• Select a different additional master from the dropdown above</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
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
