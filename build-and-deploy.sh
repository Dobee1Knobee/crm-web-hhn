#!/bin/bash

# build-and-deploy.sh
# Скрипт для сборки Docker образа на Mac и деплоя на Google Cloud Run

# Установка переменных
PROJECT_ID="carwash-master"
SERVICE_NAME="crm-web-hhn"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Начинаем сборку для Google Cloud Run${NC}"

# ========================================
# СПОСОБ 1: Использование buildx для multi-platform
# ========================================
build_with_buildx() {
    echo -e "${GREEN}📦 Сборка с Docker Buildx (рекомендуется)${NC}"

    # Создаем builder если его нет
    docker buildx create --name cloud-run-builder --use 2>/dev/null || docker buildx use cloud-run-builder

    # Собираем для linux/amd64
    docker buildx build \
        --platform linux/amd64 \
        --tag ${IMAGE_NAME}:latest \
        --tag ${IMAGE_NAME}:$(date +%Y%m%d-%H%M%S) \
        --build-arg NEXT_PUBLIC_API_URL="https://bot-crm-backend-756832582185.us-central1.run.app/api" \
        --push \
        .
}

# ========================================
# СПОСОБ 2: Сборка напрямую в Google Cloud Build
# ========================================
build_with_cloud_build() {
    echo -e "${GREEN}☁️ Сборка в Google Cloud Build${NC}"

    # Создаем cloudbuild.yaml
    cat > cloudbuild.yaml << EOF
steps:
  # Сборка Docker образа
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '--platform', 'linux/amd64',
      '-t', '${IMAGE_NAME}:latest',
      '-t', '${IMAGE_NAME}:\$BUILD_ID',
      '--build-arg', 'NEXT_PUBLIC_API_URL=https://bot-crm-backend-756832582185.us-central1.run.app/api',
      '.'
    ]

  # Push образа в Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${IMAGE_NAME}:latest']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${IMAGE_NAME}:\$BUILD_ID']

  # Деплой на Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', '${SERVICE_NAME}',
      '--image', '${IMAGE_NAME}:latest',
      '--region', '${REGION}',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--port', '3000',
      '--memory', '512Mi',
      '--cpu', '1',
      '--min-instances', '0',
      '--max-instances', '10',
      '--set-env-vars', 'NODE_ENV=production,NEXT_PUBLIC_API_URL=https://bot-crm-backend-756832582185.us-central1.run.app/api'
    ]

images:
  - '${IMAGE_NAME}:latest'
  - '${IMAGE_NAME}:\$BUILD_ID'

timeout: '1200s'
EOF

    # Запускаем сборку в облаке
    gcloud builds submit --config cloudbuild.yaml .
}

# ========================================
# СПОСОБ 3: Локальная сборка с эмуляцией
# ========================================
build_locally() {
    echo -e "${YELLOW}⚠️ Локальная сборка с эмуляцией (медленно на Mac M1/M2)${NC}"

    # Собираем с указанием платформы
    docker build \
        --platform linux/amd64 \
        -t ${IMAGE_NAME}:latest \
        --build-arg NEXT_PUBLIC_API_URL="https://bot-crm-backend-756832582185.us-central1.run.app/api" \
        .

    # Проверяем архитектуру
    echo -e "${YELLOW}Проверка архитектуры образа:${NC}"
    docker inspect ${IMAGE_NAME}:latest | grep Architecture

    # Push в Container Registry
    echo -e "${GREEN}📤 Загрузка образа в Google Container Registry${NC}"
    docker push ${IMAGE_NAME}:latest
}

# ========================================
# Деплой на Cloud Run
# ========================================
deploy_to_cloud_run() {
    echo -e "${GREEN}🚀 Деплой на Cloud Run${NC}"

    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME}:latest \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 3000 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=https://bot-crm-backend-756832582185.us-central1.run.app/api"
}

# ========================================
# Главное меню
# ========================================
echo "Выберите способ сборки:"
echo "1) Docker Buildx (рекомендуется)"
echo "2) Google Cloud Build (сборка в облаке)"
echo "3) Локальная сборка (медленно на M1/M2)"
read -p "Ваш выбор (1-3): " choice

case $choice in
    1)
        build_with_buildx
        ;;
    2)
        build_with_cloud_build
        ;;
    3)
        build_locally
        deploy_to_cloud_run
        ;;
    *)
        echo -e "${RED}Неверный выбор${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Готово! Проверьте ваш сервис:${NC}"
echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}"