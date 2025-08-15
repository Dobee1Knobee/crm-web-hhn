# ========================================
# ВАЖНО: MULTI-PLATFORM BUILD ДЛЯ CLOUD RUN
# ========================================
# Cloud Run требует linux/amd64 архитектуру
# На Mac M1/M2 по умолчанию собирается arm64, что НЕ РАБОТАЕТ на Cloud Run!

# Указываем платформу явно для совместимости с Cloud Run
# Это заставит Docker на Mac эмулировать amd64 архитектуру
FROM --platform=linux/amd64 node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# ========================================
# ЭТАП 2: УСТАНОВКА ЗАВИСИМОСТЕЙ
# ========================================
FROM --platform=linux/amd64 base AS deps

# Важно для некоторых npm пакетов на Alpine
RUN apk add --no-cache libc6-compat

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm ci --prefer-offline

# ========================================
# ЭТАП 3: СБОРКА ПРИЛОЖЕНИЯ
# ========================================
FROM --platform=linux/amd64 base AS builder

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Отключаем телеметрию Next.js
ENV NEXT_TELEMETRY_DISABLED 1

# ВАЖНО: Для Next.js нужно настроить output в next.config.js
# Убедитесь, что в next.config.js есть: output: 'standalone'

# Переменные окружения для сборки
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Собираем приложение
RUN npm run build

# ========================================
# ЭТАП 4: PRODUCTION ОБРАЗ ДЛЯ CLOUD RUN
# ========================================
FROM --platform=linux/amd64 base AS runner

# Production режим
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Создаем директорию для кэша
RUN mkdir .next && chown nextjs:nodejs .next

# Копируем только необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Переключаемся на пользователя без root
USER nextjs

# Cloud Run автоматически устанавливает переменную PORT
# Приложение ДОЛЖНО слушать на этом порту
EXPOSE 8080

# Cloud Run требует, чтобы приложение слушало на 0.0.0.0
ENV HOSTNAME "0.0.0.0"

# Cloud Run передает порт через переменную окружения PORT
# Используем ${PORT:-8080} для fallback на 8080 если PORT не установлен
# Добавляем поддержку переменной PORT для Cloud Run
CMD ["sh", "-c", "PORT=${PORT:-8080} node server.js"]