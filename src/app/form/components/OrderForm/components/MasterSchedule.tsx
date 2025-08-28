import { useOrderStore } from '@/stores/orderStore'
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface TimeSlot {
    hour: number
    amPM: string
    busy: boolean
    checked: boolean
    lead_id?: string
}

interface MasterScheduleProps {
    masterName: string
    schedule: any[] // Expecting an array of master schedules
    selectedDate?: string
    onSlotsChange?: (selectedSlots: Set<string>) => void // Callback для передачи выбранных слотов
}

export default function MasterSchedule({ masterName, schedule, selectedDate, onSlotsChange }: MasterScheduleProps) {
    // Состояние для выбранных слотов
    const { updateFormData } = useOrderStore()
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
    
    // Получаем базовую информацию о расписании
    const availableDates = schedule && Array.isArray(schedule) 
        ? schedule.find((item: any) => item && item.master_name === masterName)?.schedule 
            ? Object.keys(schedule.find((item: any) => item && item.master_name === masterName)?.schedule || {})
            : []
        : []
    
    const targetDate = selectedDate || new Date().toISOString().split('T')[0] || availableDates[0]
    const daySlots = schedule && Array.isArray(schedule) 
        ? schedule.find((item: any) => item && item.master_name === masterName)?.schedule?.[targetDate] || []
        : []
    
    const hourOfStartOrder = Array.from(selectedSlots).map(slot => Number(slot.split('-')[4])).sort((a, b) => a - b)
    const minHourOfStartOrder = hourOfStartOrder[0]
    const amPMOfStartOrder = Array.from(selectedSlots).map(slot => slot.split('-')[5])

    console.log('hourOfStartOrder:', hourOfStartOrder)
    console.log('minHourOfStartOrder:', minHourOfStartOrder)
    console.log('amPMOfStartOrder:', amPMOfStartOrder)
    
    useEffect(() => {
        if (minHourOfStartOrder && amPMOfStartOrder[0] && selectedSlots.size > 0) {
            const timeValue = minHourOfStartOrder.toString().concat(amPMOfStartOrder[0])
            console.log('Updating time to:', timeValue)
            
            // Получаем текущее значение времени из формы
            const currentTime = useOrderStore.getState().formData.time
            
            // Обновляем только если значение изменилось
            if (currentTime !== timeValue) {
                updateFormData("time", timeValue)
            }
        }
        
        // Вызываем callback для передачи выбранных слотов
        if (onSlotsChange) {
            onSlotsChange(selectedSlots)
        }
    }, [selectedSlots.size, minHourOfStartOrder, amPMOfStartOrder, onSlotsChange])
    
    // Безопасная проверка типа schedule
    if (!schedule || !Array.isArray(schedule)) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
                <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 mr-2 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Schedule for {masterName}</h2>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No schedule data available</p>
                    {schedule && !Array.isArray(schedule) && (
                        <p className="text-sm text-red-500 mt-2">
                            Expected array, got: {typeof schedule}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // Находим расписание для выбранного мастера
    const masterSchedule = schedule.find((item: any) => item && item.master_name === masterName)

    if (!masterSchedule) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
                <div className="flex items-center mb-4">
                    <Calendar className="w-5 h-5 mr-2 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Schedule for {masterName}</h2>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No schedule data available for {masterName}</p>
                </div>
            </div>
        )
    }


    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Schedule for {masterName}</h2>
                </div>
                <div className="text-sm text-gray-500">
                    {new Date(targetDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Сетка временных слотов */}
            {Array.isArray(daySlots) && daySlots.length > 0 ? (
                <div className="grid grid-cols-5 gap-3">
                    {daySlots.map((slot: TimeSlot, index: number) => (
                        <div
                            key={index}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105
                                ${selectedSlots.has(`${masterName}-${targetDate}-${slot.hour}-${slot.amPM}`)
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : slot.busy
                                    ? 'bg-red-50 border-red-200 text-red-700'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }
                                ${slot.busy && 'cursor-not-allowed'}
                            `}
                            onClick={() => {
                                if(!slot.busy){
                                    const slotKey = `${masterName}-${targetDate}-${slot.hour}-${slot.amPM}`
                                    if (selectedSlots.has(slotKey)) {
                                        setSelectedSlots(prev => {
                                            const newSet = new Set(prev)
                                            newSet.delete(slotKey)
                                            console.log('Removed slot:', slotKey, 'New state:', newSet)
                                            // Обновляем форму с новым состоянием
                                            updateFormData("dateSlots", Array.from(newSet).join(','))
                                            return newSet
                                        })
                                    } else {
                                        setSelectedSlots(prev => {
                                            const newSet = new Set(prev).add(slotKey)
                                            console.log('Added slot:', slotKey, 'New state:', newSet)
                                            // Обновляем форму с новым состоянием
                                            updateFormData("dateSlots", Array.from(newSet).join(','))
                                            return newSet
                                        })
                                    }
                                }
                            }}
                        >
                            {/* Статус слота */}
                            <div className="absolute -top-2 -right-2">
                                {selectedSlots.has(`${masterName}-${targetDate}-${slot.hour}-${slot.amPM}`) ? (
                                    <CheckCircle className="w-5 h-5 text-blue-500 bg-white rounded-full" />
                                ) : slot.busy ? (
                                    <XCircle className="w-5 h-5 text-red-500 bg-white rounded-full" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
                                )}
                            </div>

                            {/* Время */}
                            <div className="text-center">
                                <div className="text-lg font-bold">
                                    {slot.hour}
                                </div>
                                <div className="text-xs font-medium uppercase tracking-wide">
                                    {slot.amPM}
                                </div>
                            </div>

                            {/* Статус */}
                            <div className="mt-2 text-center">
                                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    selectedSlots.has(`${masterName}-${targetDate}-${slot.hour}-${slot.amPM}`)
                                        ? 'bg-blue-100 text-blue-700'
                                        : slot.busy
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                }`}>
                                    {selectedSlots.has(`${masterName}-${targetDate}-${slot.hour}-${slot.amPM}`) ? 'Selected' : slot.busy ? 'Busy' : 'Available'}
                                </div>
                            </div>

                            {/* ID заказа если занят */}
                            {slot.busy && slot.lead_id && (
                                <div className="mt-2 text-center">
                                    <div className="text-xs text-red-600 font-mono bg-red-100 px-2 py-1 rounded">
                                        #{slot.lead_id}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No time slots available for this date</p>
                </div>
            )}

            {/* Легенда */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-200 border-2 border-green-300 rounded mr-2"></div>
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-200 border-2 border-blue-300 rounded mr-2"></div>
                        <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-200 border-2 border-red-300 rounded mr-2"></div>
                        <span className="text-gray-600">Busy</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
