import { useState, useEffect } from "react";

export const useGetCities = (team: string) => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, [team]); // перезапуск при смене team

    return { cities, loading, error };
};
