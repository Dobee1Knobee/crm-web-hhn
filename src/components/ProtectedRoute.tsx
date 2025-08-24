"use client";
import { useOrderStore } from "@/stores/orderStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
    const currentUser = useOrderStore(state => state.currentUser);
    const initFromStorage = useOrderStore(state => state.initFromStorage);
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

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
                    if (!user) {
                        console.log("User not authenticated, redirecting to login");
                        router.push(redirectTo);
                    } else {
                        setIsChecking(false);
                    }
                }, 100);
            } catch (error) {
                console.error("Auth check error:", error);
                router.push(redirectTo);
            }
        };

        checkAuth();
    }, [currentUser, initFromStorage, router, redirectTo]);

    // Если проверяем авторизацию, показываем загрузку
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Если пользователь не авторизован, ничего не показываем (будет редирект)
    if (!currentUser) {
        return null;
    }

    // Если пользователь авторизован, показываем содержимое
    return <>{children}</>;
}
