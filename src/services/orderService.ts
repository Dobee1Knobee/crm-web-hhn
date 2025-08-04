import { ApiOrder } from '@/types/api';
import { Order } from '@/types/domain';
import { OrderAdapter } from './orderAdapter';

const BASE_URL = 'https://bot-crm-backend-756832582185.us-central1.run.app/api';

// интерфейс для пагинации
export interface PaginationInfo {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

// Интерфейс ответа от API
interface GetOrdersResponse {
    success: boolean;
    orders: ApiOrder[];
    count: number;
    pagination: PaginationInfo;
}

export class OrderService {
    /**
     * Получить заказы пользователя с пагинацией
     */
    static async getUserOrders(
        username: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{orders: Order[], pagination: PaginationInfo}> {
        const response = await fetch(
            `${BASE_URL}/user/myOrders/${username}?page=${page}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch orders: ${response.status}`);
        }

        const data: GetOrdersResponse = await response.json();

        return {
            orders: data.orders.map((apiOrder: ApiOrder) => OrderAdapter.fromApi(apiOrder)),
            pagination: data.pagination
        };
    }

    /**
     * Получить заказ по ID
     */
    static async getOrderById(orderId: string): Promise<Order> {
        const response = await fetch(`${BASE_URL}/orderByLeadId/${orderId}`);

        if (!response.ok) {
            throw new Error(`Order not found: ${orderId}`);
        }

        const apiOrder: ApiOrder = await response.json();
        return OrderAdapter.fromApi(apiOrder);
    }

    /**
     * Создать новый заказ
     */
    static async createOrder(orderData: Partial<Order>): Promise<Order> {
        const apiData = OrderAdapter.toApi(orderData as Order);

        const response = await fetch(`${BASE_URL}/addOrder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create order: ${response.status}`);
        }

        const result = await response.json();

        // Возвращаем созданный заказ
        return await this.getOrderById(result.leadId);
    }

    /**
     * Обновить заказ
     */
    static async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
        const apiUpdates = OrderAdapter.toApi(updates as Order);

        const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiUpdates),
        });

        if (!response.ok) {
            throw new Error(`Failed to update order: ${response.status}`);
        }

        // Возвращаем обновленный заказ
        return await this.getOrderById(orderId);
    }
}
