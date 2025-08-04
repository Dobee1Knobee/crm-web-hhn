'use client';

import { OrderAdapter } from '@/services/orderAdapter';
import { OrderStatus } from '@/types/api';
import {useEffect, useState} from 'react';
 const WelcomePage = () => {
    // src/Components/WelcomePage/WelcomePage.tsx
// Добавь эти импорты в начало файла

// В самом начале компонента WelcomePage добавь:
    useEffect(() => {
        // Тестируем адаптер
        const testApiOrder = {
            _id: "507f1f77bcf86cd799439011",
            order_id: "CE0727114",
            owner: "@devapi1",
            team: "A" as const,
            manager_id: "E",
            leadName: "John Doe",
            phone: "1234567890",
            address: "123 Main St",
            zip_code: "90210",
            city: "Los Angeles",
            client_id: 12345,
            text_status: OrderStatus.IN_WORK,
            services: [],
            total: 150,
            date: "2025-01-20T15:30:00Z",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        try {
            const domainOrder = OrderAdapter.fromApi(testApiOrder);
            console.log('✅ API → Domain работает:', domainOrder);

            const backToApi = OrderAdapter.toApi(domainOrder);
            console.log('✅ Domain → API работает:', backToApi);
        } catch (error) {
            console.error('❌ Ошибка в адаптере:', error);
        }
    }, []);
}
export default WelcomePage;