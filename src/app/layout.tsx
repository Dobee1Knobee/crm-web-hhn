// src/app/layout.tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
        <body
            className={inter.className}
            suppressHydrationWarning
        >

        {children}
        </body>
        </html>
    );
}
