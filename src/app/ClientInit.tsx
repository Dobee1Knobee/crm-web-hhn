'use client';

import { useEffect } from 'react';
import { useUserByAt } from '@/hooks/useUserByAt';
import { useOrderStore }  from '@/stores/orderStore';

export default function ClientInit() {
    const at             = 'devapi1';
    const user           = useUserByAt(at);
    const setCurrentUser = useOrderStore(s => s.setCurrentUser);
    const fetchOrders    = useOrderStore(s => s.fetchOrders);

    useEffect(() => {
        if (!user) return;

        setCurrentUser({
            userId:   user.manager_id?.toString() || 'unknown',
            userName: user.name              || 'Unknown User',
            userAt:   user.at                || 'unknown_at',
            team:     user.team?.toString()  || 'A',
        });

        fetchOrders();
    }, [user, setCurrentUser, fetchOrders]);

    return null; // ничего не рендерим — это лишь инициализация стора
}
