// src/app/layout.tsx
import AuthProvider from "@/app/auth/AuthProvider"
import { AddressFitNotification } from "@/components/AddressFitNotification"
import ErrorBoundary from "@/components/ErrorBoundary"
import PerformanceMonitor from "@/components/PerformanceMonitor"
import { Inter } from 'next/font/google'
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <body
            className={inter.className}
            suppressHydrationWarning
        >
        <ErrorBoundary>
            <AuthProvider>
                {children}
            </AuthProvider>
            <AddressFitNotification />
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{
                    top: 20,
                    left: 20,
                    bottom: 20,
                    right: 20,
                }}
                toastOptions={{
                    // 🎯 Базовые настройки для всех тостеров
                    duration: 4000,
                    className: '',
                    style: {
                        background: '#fff',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        maxWidth: '420px',
                        wordBreak: 'break-word',
                    },

                    // Замените существующий тост в target-notification на этот:
                    custom: {
                        duration: 4000,
                        style: {
                            background: '#3b82f6', // blue-500
                            color: '#ffffff',
                            border: '1px solid #2563eb', // blue-600
                            fontWeight: '500',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            fontSize: '14px',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#3b82f6',
                        },
                    },
                    // ✅ Успешные операции (зеленый)
                    success: {
                        duration: 3000,
                        style: {
                            background: '#10b981', // emerald-500
                            color: '#ffffff',
                            border: '1px solid #059669', // emerald-600
                            fontWeight: '500',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#10b981',
                        },
                    },

                    // ❌ Ошибки (красный)
                    error: {
                        duration: 6000, // Дольше показываем ошибки
                        style: {
                            background: '#ef4444', // red-500
                            color: '#ffffff',
                            border: '1px solid #dc2626', // red-600
                            fontWeight: '500',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#ef4444',
                        },
                    },

                    // ⚠️ Предупреждения (оранжевый)
                    loading: {
                        duration: Infinity, // Показываем пока не закроем вручную
                        style: {
                            background: '#f59e0b', // amber-500
                            color: '#ffffff',
                            border: '1px solid #d97706', // amber-600
                            fontWeight: '500',
                        },
                        iconTheme: {
                            primary: '#ffffff',
                            secondary: '#f59e0b',
                        },
                    },
                }}
            />
            <PerformanceMonitor />
        </ErrorBoundary>
        </body>
        </html>
    );
}
