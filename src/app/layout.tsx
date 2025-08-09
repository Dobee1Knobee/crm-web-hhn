// src/app/layout.tsx
import { Inter } from 'next/font/google';
import ClientInit from "@/app/ClientInit";
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <body
            className={inter.className}
            suppressHydrationWarning
        >
        <ClientInit />

        {children}
        </body>
        </html>
    );
}
