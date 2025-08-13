"use client";
import { useEffect, useRef } from "react";
import { useOrderStore } from "@/stores/orderStore";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const currentUser        = useOrderStore(s => s.currentUser);
    const isSocketConnected  = useOrderStore(s => s.isSocketConnected);
    const connectSocket      = useOrderStore(s => s.connectSocket);
    const initFromStorage    = useOrderStore(s => s.initFromStorage);

    // 1) На первом маунте подтянуть пользователя из sessionStorage (если его ещё нет)
    const initedRef = useRef(false);
    useEffect(() => {
        if (initedRef.current) return;
        initedRef.current = true;

        if (!currentUser) {
            try {
                initFromStorage(); // синхронно кладёт user в стор, если он есть в sessionStorage
            } catch (e) {
                console.error("initFromStorage error:", e);
            }
        }
    }, [currentUser, initFromStorage]);

    // 2) Как только пользователь известен — гарантированно подключаем сокет один раз
    useEffect(() => {
        if (!currentUser?.team || !currentUser?.userName) return;
        if (isSocketConnected) return;
        connectSocket(); // idempotent: внутри должен проверять, что сокет ещё не подключён
    }, [currentUser?.team, currentUser?.userName, isSocketConnected, connectSocket]);

    // 3) Если вкладка вернулась на передний план — убедимся, что соединение живо
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible" && currentUser && !isSocketConnected) {
                connectSocket();
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [currentUser, isSocketConnected, connectSocket]);

    return <>{children}</>;
}
