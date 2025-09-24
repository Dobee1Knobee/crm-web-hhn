// types/order.types.ts

// ===== БАЗОВЫЕ ИНТЕРФЕЙСЫ =====

// Интерфейс для визитов/посещений
export interface OrderVisit {
    id?: string;
    date: Date;
    status: string;
    notes?: string;
    duration?: number;
    [key: string]: unknown; // для дополнительных полей
}

// Интерфейс для пользователя в системе передач
export interface TransferUser {
    user_id: string;
    user_name: string;
    user_at: string; // telegram username
    team: string;
}

// Интерфейс для информации о передаче
export interface TransferInfo extends TransferUser {
    date: Date;
}

// Статусы передачи заказов
export enum TransferStatus {
    ACTIVE = 'active',
    IN_BUFFER = 'in_buffer',
    TRANSFERRED = 'transferred'
}

// Действия в истории передач
export enum TransferAction {
    TRANSFERRED = 'transferred',
    TAKEN = 'taken',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
    TAKEN_BACK = 'taken_back'
}

// ===== ИНТЕРФЕЙСЫ ДЛЯ УСЛУГ =====

// Дополнительные услуги и материалы
export interface ServiceAddon {
    label: string;
    value: string;
    price: number;
    count: number;
}

export interface ServiceMaterial {
    label: string;
    value: string;
    price: number;
    count: number;
}

// Основная услуга в заказе
export interface OrderService {
    label: string;
    diagonal?: string;

    value?: string;
    count: number;
    workType: string[];
    message?: string;
    price: number;
    mountType?: string;
    mountCount?: number;
    mountPrice?: number;
    materialPrice?: number;
    addonsPrice?: number;
    addons: ServiceAddon[];
    materials: ServiceMaterial[];
}

// ===== ИСТОРИЯ ИЗМЕНЕНИЙ =====

export interface OrderChange {
    changedAt: Date;
    changedBy: string;
    changes: Record<string, unknown>;
}

// История передач заказов
export interface TransferHistoryItem {
    action: TransferAction;
    from_user?: TransferUser;
    to_team?: string;
    to_user?: TransferUser;
    note?: string;
    date: Date;
}

// ===== ОСНОВНОЙ ИНТЕРФЕЙС ЗАКАЗА =====

export interface Order {
    leadId: string;
    _id?: string; // MongoDB ID
    // ===== БАЗОВЫЕ ПОЛЯ =====
    owner: string; // обязательное поле
    order_id: string;
    createdAt: Date;
    custom?: number;
    address?: string;
    client_id?: number;
    form_ID?: string;
    comments?: string;
    zip_code?: string;
    team?: string;
    date?: string; // строка, как в модели
    manager_id?: string;
    manager_price?: number;
    created_at?: Date;
    // ===== СИСТЕМНЫЕ ПОЛЯ =====
    miles: number[];
    response_time: string[];
    text_status: string;
    visits: OrderVisit[];
    canceled: boolean;
    schedule_string?: string;

    // ===== ПОЛЯ СИСТЕМЫ ПЕРЕДАЧ =====
    transfer_status: TransferStatus;
    transferred_from?: TransferInfo;
    transferred_to_team?: string;
    taken_by?: TransferInfo;
    transfer_note?: string;
    transfer_history: TransferHistoryItem[];

    // ===== ИНФОРМАЦИЯ О КЛИЕНТЕ И ЗАКАЗЕ =====
    leadName?: string;
    phone?: string;
    city?: string;
    master?: string;
    additionalTechName?: string;
    dateSlots?: string[];
    additionalTechSlots?: string[];
    comment?: string;
    total?: number;
    services: OrderService[];
    time?: string;
    // ===== ИСТОРИЯ И МЕТАДАННЫЕ =====
    original?: Record<string, unknown>;
    changes: OrderChange[];
}

// ===== ИНТЕРФЕЙСЫ ДЛЯ СОЗДАНИЯ ЗАКАЗА =====

// Данные формы для создания заказа
export interface CreateOrderFormData {
    // Customer Info
    customerName: string;
    phoneNumber: string;
    address: string;
    zipCode?: string;

    // Date & Time
    date: string;
    time: string;

    // Location & Master
    city: string;
    masterId?: string;
    masterName?: string;

    // Description
    description: string;

    // Team info
    teamId: string;
}

// Услуга из drag&drop системы (для конвертации)
export interface ServiceItem {
    id: string;
    name: string;
    value?: string;
    price: number;
    quantity?: number;
    orderId?: number;
    category: 'main' | 'additional' | 'materials';
    subItems?: ServiceItem[];
    parentMainItemId?: number;
    diagonals?: string[]; // массив диагоналей для main элементов
    customPrice?: number; // кастомная цена для NO TV
}

// Данные для создания заказа в MongoDB
export interface CreateOrderData {
    // Базовые обязательные поля
    owner: string | undefined;
    dateSlots?:string[];
    team: string;
    custom?: number;
    // Информация о клиенте
    leadName: string;
    phone: string;
    address?: string;
    zip_code?: string;
    city: string;

    // Дата и мастер
    date: string;
    time:string;
    master?: string;
    additionalTechName?: string;
    additionalTechSlots?: string[];
    manager_id?: string;

    // Описание и комментарии
    comment?: string;
    comments?: string;

    // Услуги и цена
    services: OrderService[];
    total: number;

    // Статусы
    text_status?: string;
    transfer_status: TransferStatus;
    canceled: boolean;

    // Системные поля с дефолтными значениями
    miles: number[];
    response_time: string[];
    visits: OrderVisit[];
    transfer_history: TransferHistoryItem[];
    changes: OrderChange[];
}

// ===== УТИЛИТАРНЫЕ ИНТЕРФЕЙСЫ =====

// Для обновления заказа
export interface UpdateOrderData extends Partial<Order> {
    _id: string;
}

// Для поиска заказов
export interface OrderSearchQuery {
    owner?: string;
    team?: string;
    transfer_status?: TransferStatus;
    text_status?: string;
    phone?: string;
    leadName?: string;
    city?: string;
    date?: string;
    canceled?: boolean;
}

// Ответ API для списка заказов
export interface OrdersApiResponse {
    orders: Order[];
    total: number;
    page: number;
    limit: number;
}

// Ответ API для одного заказа
export interface OrderApiResponse {
    order: Order;
}

// ===== ФУНКЦИИ-ПОМОЩНИКИ ДЛЯ ТИПИЗАЦИИ =====

// Проверка, является ли заказ переданным
export function isTransferred(order: Order): boolean {
    return order.transfer_status === TransferStatus.TRANSFERRED;
}

// Проверка, находится ли заказ в буфере
export function isInBuffer(order: Order): boolean {
    return order.transfer_status === TransferStatus.IN_BUFFER;
}

// Проверка, активен ли заказ
export function isActive(order: Order): boolean {
    return order.transfer_status === TransferStatus.ACTIVE;
}

// Получение общей стоимости услуг
export function calculateTotal(services: OrderService[]): number {
    return services.reduce((total, service) => {
        let serviceTotal = service.price * service.count;

        // Добавляем стоимость дополнительных услуг
        if (service.addonsPrice) {
            serviceTotal += service.addonsPrice;
        }

        // Добавляем стоимость материалов
        if (service.materialPrice) {
            serviceTotal += service.materialPrice;
        }

        // Добавляем стоимость монтажа
        if (service.mountPrice && service.mountCount) {
            serviceTotal += service.mountPrice * service.mountCount;
        }

        return total + serviceTotal;
    }, 0);
}

// Конвертация ServiceItem в OrderService
export function convertServiceItemToOrderService(
    serviceItem: ServiceItem,
    workTypes: string[] = []
): OrderService {
    const baseService: OrderService = {
        label: serviceItem.name,
        count: serviceItem.quantity || 1,
        workType: workTypes,
        price: serviceItem.customPrice || serviceItem.price,
        addons: [],
        materials: []
    };

    // Добавляем диагонали если есть
    if (serviceItem.diagonals && serviceItem.diagonals.length > 0) {
        baseService.diagonal = serviceItem.diagonals.join(', ');
    }

    // Конвертируем подэлементы
    if (serviceItem.subItems && serviceItem.subItems.length > 0) {
        serviceItem.subItems.forEach(subItem => {
            if (subItem.category === 'additional') {
                baseService.addons.push({
                    label: subItem.name,
                    value: subItem.id,
                    price: subItem.price,
                    count: subItem.quantity || 1
                });
            } else if (subItem.category === 'materials') {
                baseService.materials.push({
                    label: subItem.name,
                    value: subItem.id,
                    price: subItem.price,
                    count: subItem.quantity || 1
                });
            }
        });

        // Подсчитываем общую стоимость дополнительных услуг и материалов
        baseService.addonsPrice = baseService.addons.reduce(
            (sum, addon) => sum + (addon.price * addon.count), 0
        );

        baseService.materialPrice = baseService.materials.reduce(
            (sum, material) => sum + (material.price * material.count), 0
        );
    }

    return baseService;
}

export default Order;