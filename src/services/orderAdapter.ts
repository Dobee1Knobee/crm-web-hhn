// src/services/orderAdapter.ts
import { ApiOrder } from '@/types/api'
import { Order, Team, TransferInfo } from '@/types/domain'

export class OrderAdapter {
    /**
     * Преобразует ApiOrder в удобную для UI модель Order
     */
    static fromApi(apiOrder: ApiOrder): Order {
        // Обрабатываем transfer информацию
        let transferInfo: TransferInfo | undefined;
        if (apiOrder.transfer_status) {
            transferInfo = {
                status: apiOrder.transfer_status,
                fromUser: apiOrder.transferred_from ? {
                    id: apiOrder.transferred_from.user_id,
                    name: apiOrder.transferred_from.user_name,
                    username: apiOrder.transferred_from.user_at,
                    team: apiOrder.transferred_from.team as Team,
                    date: apiOrder.transferred_from.date
                } : undefined,
                toTeam: apiOrder.transferred_to_team as Team,
                note: apiOrder.transfer_note
            };
        }

        return {
            id: apiOrder.order_id,
            customerId: apiOrder.client_id,
            customerName: apiOrder.leadName,
            phone: apiOrder.phone,
            address: apiOrder.address,
            zipCode: apiOrder.zip_code,
            city: apiOrder.city,

            status: apiOrder.text_status,
            services: apiOrder.services, // пока как есть
            total: apiOrder.total,
            master: apiOrder.master,
            date: apiOrder.date,
            description: apiOrder.comment,

            transferInfo,

            // Метаданные
            owner: apiOrder.owner,
            team: apiOrder.team,
            createdAt: apiOrder.createdAt,
            updatedAt: apiOrder.updatedAt
        };
    }

    /**
     * Преобразует Order обратно в ApiOrder для отправки на сервер
     */
    static toApi(order: Order): Partial<ApiOrder> {
        return {
            order_id: order.id,
            leadName: order.customerName,
            phone: order.phone,
            address: order.address,
            zip_code: order.zipCode,
            city: order.city,
            text_status: order.status,
            services: order.services,
            total: order.total,
            master: order.master,
            date: order.date,
            comment: order.description,
            owner: order.owner,
            team: order.team
        };
    }
}