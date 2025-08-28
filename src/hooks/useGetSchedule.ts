import { useOrderStore } from '@/stores/orderStore'
import { useState } from 'react'

import { useEffect } from 'react'

export const useGetSchedule = () => {
		const team = useOrderStore((state) => state.currentUser?.team);
    const [schedule, setSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!team) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const res = await fetch(
                    `https://bot-crm-backend-756832582185.us-central1.run.app/api/order/getSchedule/${team}`
                );
                const data = await res.json();
                
                // Отладочная информация - проверяем все ключи в ответе
                console.log('🔍 Schedule API Response:', {
                    type: typeof data,
                    isArray: Array.isArray(data),
                    keys: data ? Object.keys(data) : 'no data',
                    fullData: data
                });
                
                // Ищем ключ, который содержит массив расписаний
                let scheduleData = null;
                if (data && typeof data === 'object') {
                    // Проверяем различные возможные ключи
                    if (data.schedule && Array.isArray(data.schedule)) {
                        scheduleData = data.schedule;
                    } else if (data.hasSchedule && Array.isArray(data.hasSchedule)) {
                        scheduleData = data.hasSchedule;
                    } else if (data.masters && Array.isArray(data.masters)) {
                        scheduleData = data.masters;
                    } else {
                        // Ищем любой массив в ответе
                        for (const [key, value] of Object.entries(data)) {
                            if (Array.isArray(value) && value.length > 0) {
                                console.log(`📋 Found schedule data in key: ${key}`);
                                scheduleData = value;
                                break;
                            }
                        }
                    }
                }
                
                if (scheduleData) {
                    console.log('✅ Schedule data found:', scheduleData);
                    setSchedule(scheduleData);
                } else {
                    console.warn('⚠️ No schedule data found in response:', data);
                    setSchedule(null);
                }
            } catch (err) {
                console.error('❌ Schedule API Error:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
            } finally {
                setLoading(false);
            }
        }
        
        fetchSchedule();
    }, [team]);

    return { schedule, loading, error };
}
