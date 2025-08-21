import { Team } from "@/types/domain"
import { useEffect, useState } from "react"

export interface User{
    _id: string;
    at:string;
    name: string;
    team : Team;
    manager_id: string;
    working?: boolean;
    pinCode?: string;
}

export const useUserByAt = (at: string): User | null => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!at) return;

        fetch(`https://bot-crm-backend-756832582185.us-central1.run.app/api/user?at=${at}`)
            .then((res) => res.ok ? res.json() : null)
            .then((userData: User | null) => setUser(userData))
            .catch(() => setUser(null));
    }, [at]);

    return user;
};