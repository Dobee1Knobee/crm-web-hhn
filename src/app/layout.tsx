import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/app/global.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CRM Web HHN',
    description: 'Customer Relationship Management System',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru">
        <body className={inter.className}>
        <div className="App">
            {/* Здесь будут провайдеры контекста на следующем этапе */}
            {children}
        </div>
        </body>
        </html>
    )
}