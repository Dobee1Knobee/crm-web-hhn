import { useGetSchedule } from '@/hooks/useGetSchedule'
import { useOrderStore } from '@/stores/orderStore'
import { Calendar, Clock, Users, Wrench } from 'lucide-react'
import { useState } from 'react'

interface TimeSlot {
    hour: number
    amPM: string
    busy: boolean
    lead_id?: string
}

export default function TeamSchedule() {
    const { schedule, loading, error } = useGetSchedule()
    const { currentUser } = useOrderStore()
    const [selectedDate, setSelectedDate] = useState<string>('')

    if (loading) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-6xl">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading team schedule...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-6xl">
                <div className="text-center py-12 text-red-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-red-300" />
                    <p className="text-lg">Error loading schedule: {error}</p>
                </div>
            </div>
        )
    }

    // Безопасная проверка типа schedule
    if (!schedule || !Array.isArray(schedule)) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-6xl">
                <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No schedule data available</p>
                    {schedule && !Array.isArray(schedule) && (
                        <p className="text-sm text-red-500 mt-2">
                            Expected array, got: {typeof schedule}
                        </p>
                    )}
                </div>
            </div>
        )
    }

    if (schedule.length === 0) {
        return (
            <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-6xl">
                <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No schedule data available</p>
                </div>
            </div>
        )
    }

    // Получаем все доступные даты
    const allDates = new Set<string>()
    schedule.forEach((masterSchedule: any) => {
        if (masterSchedule && masterSchedule.schedule && typeof masterSchedule.schedule === 'object') {
            Object.keys(masterSchedule.schedule).forEach(date => allDates.add(date))
        }
    })
    const availableDates = Array.from(allDates).sort()
    const targetDate = selectedDate || availableDates[0]

    // Отладочная информация
    console.log('📅 TeamSchedule Debug:', {
        scheduleLength: schedule.length,
        availableDates,
        targetDate,
        firstMaster: schedule[0]
    })

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 m-9 w-full max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Users className="w-6 h-6 mr-3 text-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-900">Team Schedule</h1>
                    <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {currentUser?.team || 'Unknown Team'}
                    </span>
                </div>

                {/* Выбор даты */}
                <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <select
                        value={targetDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                        {availableDates.map(date => (
                            <option key={date} value={date}>{date}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Расписание по техникам */}
            <div className="space-y-6">
                {schedule.map((masterSchedule: any, index: number) => {
                    // Безопасная проверка структуры данных
                    if (!masterSchedule || !masterSchedule.schedule || !masterSchedule.master_name) {
                        return null
                    }

                    const daySlots = masterSchedule.schedule[targetDate] || []

                    return (
                        <div key={index} className="border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <Wrench className="w-5 h-5 mr-2 text-gray-700" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {masterSchedule.master_name}
                                </h3>
                                <span className="ml-3 text-sm text-gray-500">
                                    {Array.isArray(daySlots) ? daySlots.filter((slot: TimeSlot) => !slot.busy).length : 0} available slots
                                </span>
                            </div>

                            {/* Сетка временных слотов */}
                            {Array.isArray(daySlots) && daySlots.length > 0 ? (
                                <div className="grid grid-cols-8 gap-2">
                                    {daySlots.map((slot: TimeSlot, slotIndex: number) => (
                                        <div
                                            key={slotIndex}
                                            className={`
                                                relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-center
                                                ${slot.busy
                                                    ? 'bg-red-50 border-red-200 text-red-700'
                                                    : 'bg-green-50 border-green-200 text-green-700'
                                                }
                                            `}
                                        >
                                            {/* Время */}
                                            <div className="text-sm font-bold">
                                                {slot.hour}
                                            </div>
                                            <div className="text-xs uppercase tracking-wide">
                                                {slot.amPM}
                                            </div>

                                            {/* Статус */}
                                            <div className="mt-1">
                                                <div className={`text-xs px-2 py-1 rounded-full ${
                                                    slot.busy
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {slot.busy ? 'Busy' : 'Free'}
                                                </div>
                                            </div>

                                            {/* ID заказа если занят */}
                                            {slot.busy && slot.lead_id && (
                                                <div className="mt-1">
                                                    <div className="text-xs text-red-600 font-mono bg-red-100 px-1 py-0.5 rounded text-xs">
                                                        #{slot.lead_id}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p>No slots available for this date</p>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Легенда */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-8 text-sm">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-200 border-2 border-green-300 rounded mr-2"></div>
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-200 border-2 border-red-300 rounded mr-2"></div>
                        <span className="text-gray-600">Busy</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
