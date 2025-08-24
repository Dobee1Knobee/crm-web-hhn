"use client";
import { useOrderStore } from "@/stores/orderStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthRedirectProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function AuthRedirect({ children, redirectTo = "/" }: AuthRedirectProps) {
    const currentUser = useOrderStore(state => state.currentUser);
    const initFromStorage = useOrderStore(state => state.initFromStorage);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Если пользователь не загружен, пытаемся загрузить из storage
                if (!currentUser) {
                    await initFromStorage();
                }

                // Даем время на инициализацию
                setTimeout(() => {
                    const user = useOrderStore.getState().currentUser;
                    if (user) {
                        console.log("User already authenticated, redirecting to main page");
                        router.push(redirectTo);
                    }
                }, 100);
            } catch (error) {
                console.error("Auth check error:", error);
            }
        };

        checkAuth();
    }, [currentUser, initFromStorage, router, redirectTo]);

    // Если пользователь авторизован, ничего не показываем (будет редирект)
    if (currentUser) {
        return null;
    }

    // Если пользователь не авторизован, показываем содержимое (форму логина)
    return <>{children}</>;
}
