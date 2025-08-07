'use client'

import React, { useState } from 'react'
import Image from "next/image"

const PinCodePage = () => {
    const [formData, setFormData] = useState({
        telegramNick: '',
        password: ''
    })

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = () => {
        console.log('Данные входа:', formData)
        // Логика входа
    }

    return (
        <>

            <div className="min-h-screen bg-gray-50 pt-20 px-4">
                <div className="max-w-md mx-auto space-y-8">
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <div className="text-center mb-6">
                            <Image
                                src="/yellowpng.webp"
                                alt="logo"
                                width={80}
                                height={80}
                                className="mx-auto mb-4"
                            />
                        </div>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Вход в систему</h2>
                            <p className="mt-2 text-gray-600">Введите ваши данные для входа</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telegram ник
                                </label>
                                <input
                                    type="text"
                                    name="telegramNick"
                                    value={formData.telegramNick}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="@username"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Пароль
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Введите пароль"
                                    autoComplete="off"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Войти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PinCodePage