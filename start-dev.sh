#!/bin/bash

# Проверяем версию Node.js
REQUIRED_NODE_VERSION="18.19.0"
CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2)

echo "🔍 Проверка версии Node.js..."
echo "Требуется: v$REQUIRED_NODE_VERSION"
echo "Текущая:  v$CURRENT_NODE_VERSION"

# Проверяем, совместима ли версия
if [[ "$CURRENT_NODE_VERSION" == 18.* ]]; then
    echo "✅ Версия Node.js совместима"
    
    # Очищаем кэш Next.js
    echo "🧹 Очистка кэша..."
    rm -rf .next
    
    # Запускаем приложение
    echo "🚀 Запуск Next.js..."
    npm run dev
else
    echo "❌ Несовместимая версия Node.js"
    echo "💡 Рекомендуется использовать Node.js 18.x"
    echo ""
    echo "Установите правильную версию:"
    echo "  nvm install 18.19.0"
    echo "  nvm use 18.19.0"
    echo "  npm run dev"
fi
