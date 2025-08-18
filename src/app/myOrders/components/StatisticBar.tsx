// src/app/myOrders/components/StatisticBar.tsx
'use client';

import { useEffect, useState } from 'react'

export default function StatisticBar() {
    // State for the current time string
    const [timeString, setTimeString] = useState('');

    useEffect(() => {
        const updateTime = () => {
            setTimeString(new Date().toLocaleTimeString());
        };
        // Initialize immediately
        updateTime();
        // Update every second (or change interval as needed)
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Здесь будут данные из API или хуков
    const statistics = {
        inProgress: 24,
        completed: 156,
        invalidCancelled: 8,
    };

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Заказы в работе */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">⏳</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-blue-700">В работе</div>
                                <div className="text-xs text-blue-600">Active Orders</div>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-700">
                            {formatNumber(statistics.inProgress)}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 bg-blue-200 rounded-full flex-1">
                            <div
                                className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((statistics.inProgress / 50) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
              {Math.round((statistics.inProgress / 50) * 100)}%
            </span>
                    </div>
                </div>

                {/* Завершенные заказы */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">✅</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-green-700">Завершенные</div>
                                <div className="text-xs text-green-600">Completed</div>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-green-700">
                            {formatNumber(statistics.completed)}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 bg-green-200 rounded-full flex-1">
                            <div
                                className="h-2 bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((statistics.completed / 200) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-green-600 font-medium">
              {Math.round((statistics.completed / 200) * 100)}%
            </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs text-green-600">↗️</span>
                        <span className="text-xs text-green-600 font-medium">+12 today</span>
                    </div>
                </div>

                {/* Невалидные и отмененные */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">❌</span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-red-700">Отменено/Невалид</div>
                                <div className="text-xs text-red-600">Cancelled/Invalid</div>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-red-700">
                            {statistics.invalidCancelled}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 bg-red-200 rounded-full flex-1">
                            <div
                                className="h-2 bg-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((statistics.invalidCancelled / 20) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="text-xs text-red-600 font-medium">
              {Math.round((statistics.invalidCancelled / 20) * 100)}%
            </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600">📊</span>
                            <span className="text-xs text-red-600">
                {(
                    (statistics.invalidCancelled /
                        (statistics.inProgress +
                            statistics.completed +
                            statistics.invalidCancelled)) *
                    100
                ).toFixed(1)}
                                % rate
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Общая сводка */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="text-gray-600">Total Active: {statistics.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                            <span className="text-gray-600">
                Success Rate:{' '}
                                {(
                                    (statistics.completed /
                                        (statistics.completed + statistics.invalidCancelled)) *
                                    100
                                ).toFixed(1)}
                                %
              </span>
                        </div>
                    </div>
                    <div className="font-semibold text-gray-700">
                        Total Orders:{' '}
                        {statistics.inProgress +
                            statistics.completed +
                            statistics.invalidCancelled}
                    </div>
                </div>
            </div>
        </div>
    );
}
