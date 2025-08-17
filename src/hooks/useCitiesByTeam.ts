import { useEffect, useState } from "react";

interface City {
    _id: string;
    name: string;
    timezone: string;
    team: string;
    boundingbox: number[];
    latitude: number;
    longitude: number;
    location: any;
}

export const useGetCities = (team: string) => {
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!team) return; // если нет команды — не запрашиваем

        const fetchCities = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(
                    `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getCitiesByTeam?team=${team}`
                );

                if (!res.ok) {
                    throw new Error(`Ошибка загрузки городов: ${res.status}`);
                }

                const data = await res.json();
                setCities(data.cities || []);
            } catch (err) {
                console.error("❌ Ошибка загрузки городов:", err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, [team]); // перезапуск при смене team

    return { cities, loading, error };
};
