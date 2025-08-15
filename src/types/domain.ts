// src/types/domain.ts
// Удобные типы для работы в компонентах

import {ApiOrderService, OrderStatus} from "@/types/api";

export interface Order {
    id: string;              // order_id из API
    customerId: number;      // client_id из API
    customerName: string;    // leadName из API
    phone: string;
    address: string;
    zipCode: string;         // zip_code из API
    city: string;

    status: OrderStatus;     // text_status из API
    services: ApiOrderService[];
    total: number;
    master?: string;
    date: string;
    time?: string;           // Добавляем время
    description?: string;    // comment из API

    // Transfer info (если есть)
    transferInfo?: TransferInfo;

    // Метаданные
    owner: string;
    team: Team;
    createdAt: Date;
    updatedAt: Date;
}

export type Team = 'A' | 'B' | 'C' | 'W';

export interface TransferInfo {
    status: 'in_buffer' | 'transferred';
    fromUser?: TransferUser;
    toTeam?: Team;
    note?: string;
}

export interface TransferUser {
    id: string;
    name: string;
    username: string;
    team: Team;
    date: Date;
}