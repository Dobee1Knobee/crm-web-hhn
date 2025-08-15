#!/bin/bash

# monitor-deployment.sh
# Скрипт для мониторинга деплоя и проверки статуса сервиса

PROJECT_ID="carwash-master"
SERVICE_NAME="crm-web-hhn"
REGION="us-central1"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Проверка статуса сервиса
check_service_status() {
    log "Проверка статуса сервиса ${SERVICE_NAME}..."
    
    if gcloud run services describe ${SERVICE_NAME} --region=${REGION} &>/dev/null; then
        success "Сервис ${SERVICE_NAME} найден"
        
        # Получаем URL
        SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
        log "URL сервиса: ${SERVICE_URL}"
        
        # Проверяем статус
        STATUS=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.conditions[0].status)")
        if [ "$STATUS" = "True" ]; then
            success "Сервис активен и готов"
        else
            warning "Сервис не готов. Статус: ${STATUS}"
        fi
        
        # Проверяем количество ревизий
        REVISIONS=$(gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION} --format="value(metadata.name)" | wc -l)
        log "Количество ревизий: ${REVISIONS}"
        
    else
        error "Сервис ${SERVICE_NAME} не найден"
        return 1
    fi
}

# Проверка логов
check_logs() {
    log "Проверка последних логов..."
    
    echo "Последние 20 записей логов:"
    gcloud logs read --project=${PROJECT_ID} --limit=20 --format="table(timestamp,severity,textPayload)" | head -20
    
    echo ""
    log "Для просмотра всех логов используйте:"
    echo "gcloud logs read --project=${PROJECT_ID} --limit=100"
}

# Проверка метрик
check_metrics() {
    log "Проверка метрик сервиса..."
    
    # Получаем количество запросов за последний час
    REQUESTS=$(gcloud monitoring metrics list --filter="metric.type:run.googleapis.com/request_count" --limit=1 2>/dev/null | wc -l)
    
    if [ $REQUESTS -gt 1 ]; then
        log "Метрики доступны"
        echo "Для просмотра метрик в консоли:"
        echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics"
    else
        warning "Метрики пока недоступны (может потребоваться время для сбора)"
    fi
}

# Тест доступности
test_availability() {
    log "Тест доступности сервиса..."
    
    if gcloud run services describe ${SERVICE_NAME} --region=${REGION} &>/dev/null; then
        SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")
        
        if [ -n "$SERVICE_URL" ]; then
            log "Тестируем доступность: ${SERVICE_URL}"
            
            # Простой тест с curl (если доступен)
            if command -v curl &> /dev/null; then
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}" --max-time 10 2>/dev/null || echo "000")
                
                if [ "$HTTP_CODE" = "200" ]; then
                    success "Сервис отвечает (HTTP 200)"
                elif [ "$HTTP_CODE" = "000" ]; then
                    warning "Не удалось подключиться (возможно, сервис еще запускается)"
                else
                    warning "Сервис отвечает, но с кодом HTTP ${HTTP_CODE}"
                fi
            else
                log "curl не доступен, пропускаем тест доступности"
            fi
        else
            warning "URL сервиса не определен"
        fi
    else
        error "Сервис не найден"
    fi
}

# Проверка ресурсов
check_resources() {
    log "Проверка ресурсов..."
    
    # Получаем информацию о ресурсах
    gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="table(
        metadata.name,
        spec.template.spec.containers[0].resources.limits.cpu,
        spec.template.spec.containers[0].resources.limits.memory,
        spec.template.spec.containers[0].resources.requests.cpu,
        spec.template.spec.containers[0].resources.requests.memory
    )"
}

# Главное меню
show_menu() {
    echo ""
    echo "🔍 Мониторинг деплоя ${SERVICE_NAME}"
    echo "=================================="
    echo "1) Проверить статус сервиса"
    echo "2) Просмотреть логи"
    echo "3) Проверить метрики"
    echo "4) Тест доступности"
    echo "5) Проверить ресурсы"
    echo "6) Полная проверка"
    echo "0) Выход"
    echo ""
}

# Полная проверка
full_check() {
    log "🔍 Запуск полной проверки..."
    echo ""
    
    check_service_status
    echo ""
    
    check_resources
    echo ""
    
    test_availability
    echo ""
    
    check_metrics
    echo ""
    
    success "Полная проверка завершена"
}

# Основной цикл
while true; do
    show_menu
    read -p "Выберите действие (0-6): " choice
    
    case $choice in
        1)
            check_service_status
            ;;
        2)
            check_logs
            ;;
        3)
            check_metrics
            ;;
        4)
            test_availability
            ;;
        5)
            check_resources
            ;;
        6)
            full_check
            ;;
        0)
            log "Выход из мониторинга"
            exit 0
            ;;
        *)
            error "Неверный выбор"
            ;;
    esac
    
    echo ""
    read -p "Нажмите Enter для продолжения..."
done

