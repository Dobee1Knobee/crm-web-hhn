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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ ОШИБКА:${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v gcloud &> /dev/null; then
        error "Google Cloud CLI не установлен"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "Не авторизован в Google Cloud. Запустите: gcloud auth login"
        exit 1
    fi
    
    success "Все зависимости установлены"
}

# Проверка проекта
check_project() {
    log "Проверка проекта Google Cloud..."
    
    if ! gcloud projects describe ${PROJECT_ID} &> /dev/null; then
        error "Проект ${PROJECT_ID} не найден или нет доступа"
        exit 1
    fi
    
    gcloud config set project ${PROJECT_ID}
    success "Проект ${PROJECT_ID} активен"
}

echo -e "${BLUE}🚀 Начинаем сборку для Google Cloud Run${NC}"

# Проверяем зависимости и проект
check_dependencies
check_project

# ========================================
# СПОСОБ 1: Использование buildx для multi-platform
# ========================================
build_with_buildx() {
    log "📦 Сборка с Docker Buildx (рекомендуется)"

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
    
    if [ $? -eq 0 ]; then
        success "Образ успешно собран и загружен"
    else
        error "Ошибка при сборке образа"
        exit 1
    fi
}

# ========================================
# СПОСОБ 2: Сборка напрямую в Google Cloud Build
# ========================================
build_with_cloud_build() {
    log "☁️ Сборка в Google Cloud Build"

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
      '--port', '8080',
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
    log "Запуск Cloud Build..."
    gcloud builds submit --config cloudbuild.yaml .
    
    if [ $? -eq 0 ]; then
        success "Cloud Build завершен успешно"
    else
        error "Ошибка в Cloud Build"
        exit 1
    fi
}

# ========================================
# СПОСОБ 3: Локальная сборка с эмуляцией
# ========================================
build_locally() {
    warning "Локальная сборка с эмуляцией (медленно на Mac M1/M2)"

    # Собираем с указанием платформы
    log "Сборка Docker образа..."
    docker build \
        --platform linux/amd64 \
        -t ${IMAGE_NAME}:latest \
        --build-arg NEXT_PUBLIC_API_URL="https://bot-crm-backend-756832582185.us-central1.run.app/api" \
        .
    
    if [ $? -ne 0 ]; then
        error "Ошибка при сборке образа"
        exit 1
    fi

    # Проверяем архитектуру
    log "Проверка архитектуры образа:"
    docker inspect ${IMAGE_NAME}:latest | grep Architecture

    # Push в Container Registry
    log "📤 Загрузка образа в Google Container Registry"
    docker push ${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        success "Образ загружен успешно"
    else
        error "Ошибка при загрузке образа"
        exit 1
    fi
}

# ========================================
# Деплой на Cloud Run
# ========================================
deploy_to_cloud_run() {
    log "🚀 Деплой на Cloud Run"

    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME}:latest \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=https://bot-crm-backend-756832582185.us-central1.run.app/api"
    
    if [ $? -eq 0 ]; then
        success "Деплой завершен успешно"
        
        # Получаем URL сервиса
        SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
        log "🌐 Ваш сервис доступен по адресу: ${SERVICE_URL}"
    else
        error "Ошибка при деплое"
        exit 1
    fi
}

# ========================================
# Главное меню
# ========================================
echo ""
echo "Выберите способ сборки:"
echo "1) Docker Buildx (рекомендуется)"
echo "2) Google Cloud Build (сборка в облаке)"
echo "3) Локальная сборка (медленно на M1/M2)"
echo ""
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
        error "Неверный выбор"
        exit 1
        ;;
esac

echo ""
success "Готово! Проверьте ваш сервис:"
echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}"
echo ""
log "Для просмотра логов используйте:"
echo "gcloud logs read --project=${PROJECT_ID} --limit=50"