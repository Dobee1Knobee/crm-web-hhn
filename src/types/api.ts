// src/types/api.ts
// Это ТОЧНАЯ копия структуры из твоего backend

export interface ApiOrder {
    // Основные ID
    _id: string;
    order_id: string;  // "CE0727114"

    // Владелец и команда
    owner: string;     // "@devapi1"
    team: 'A' | 'B' | 'C' | 'W';
    manager_id: string;

    // Клиентские данные
    leadName: string;
    phone: string;
    address: string;
    zip_code: string;
    city: string;
    client_id: number;

    // Бизнес данные
    text_status: OrderStatus; 
    services: ApiOrderService[];
    total: number;
    master?: string;
    date: string;
    comment?: string;

    // Transfer логика (ключевая часть!)
    transfer_status?: 'in_buffer' | 'transferred';
    transferred_from?: {
        user_id: string;
        user_name: string;
        user_at: string;
        team: string;
        date: Date;
    };
    transferred_to_team?: string;
    transfer_note?: string;

    // Метаданные
    createdAt: Date;
    updatedAt: Date;
    additionalTelephone?: AdditionalPhone[];
}

export interface AdditionalPhone {
    type: string;    // номер телефона
    label: string;   // "Жена", "Работа", etc
}
export interface ApiOrderService {
    label: string;           // "TV standard < 31"
    diagonal?: string;       // "55"
    count: number;          // количество
    workType: string;       // "tv_std", "tv_big", etc
    message?: string;       // дополнительная заметка
    price: number;          // базовая цена

    // Mount данные
    mountType?: string;     // "fixed_mount", "full_motion"
    mountCount?: number;    // количество креплений
    mountPrice: number;     // цена крепления

    // Материалы
    materials: ApiMaterial[];
    materialPrice: number;

    // Дополнительные услуги
    addons: ApiAddon[];
    addonsPrice: number;
}
export interface ApiMaterial {
    label: string;          // "HDMI cable 118″"
    value: string;          // "hdmi_118"
    price: number;
    count: number;
}
export interface ApiAddon {
    label: string;          // "Cord concealment (external)"
    value: string;          // "cord_external"
    price: number;
    count: number;
}
export enum OrderStatus {
    CANCELLED = "Отменен",
    OTHER_REGION = "Другой регион",
    INVALID = "Невалидный",
    NO_ANSWER = "Недозвон",
    IN_WORK = "В работе",
    NIGHT = "Ночной",
    NIGHT_EARLY = "Ночной ранний",
    NEED_CONFIRMATION = "Нужно подтверждение",
    NEED_APPROVAL = "Нужно согласование",
    COMPLETED = "Оформлен",
    CALL_TOMORROW = "Прозвонить завтра",
    ORDER_STATUS = "Статус заказа"
}
