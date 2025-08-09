/** @type {import('next').NextConfig} */
const nextConfig = {
    // Собираем standalone-версию в .next/standalone
    output: 'standalone',

    // Отключаем ESLint-проверку при сборке
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig
