import { useOrderStore } from "@/stores/orderStore";
import { OrderStatus } from "@/types/api";
import { useState } from 'react';

interface StatusPillsProps {
    selectedStatus?: OrderStatus;
    onStatusChange?: (status: OrderStatus | null) => void;
    disabled?: boolean;
}

export default function StatusPills({
                                        selectedStatus,
                                        onStatusChange,
                                        disabled = false
                                    }: StatusPillsProps) {
    const [internalSelectedStatus, setInternalSelectedStatus] = useState<OrderStatus | null>(null);

    // Используем внешний selectedStatus если передан, иначе внутренний
    const {
        formData,
        updateFormData,
        isWorkingOnTelegramOrder,
        currentTelegramOrder
    } = useOrderStore();
    const currentSelected = formData.text_status ?? internalSelectedStatus;

    // Маппинг цветов для статусов
    const statusColors = {
        [OrderStatus.CANCELLED]: { bg: '#470909', text: '#ffffff' },
        [OrderStatus.OTHER_REGION]: { bg: '#00e5ff', text: '#000000' },
        [OrderStatus.INVALID]: { bg: '#f44336', text: '#ffffff' },
        [OrderStatus.NO_ANSWER]: { bg: '#9e9e9e', text: '#ffffff' },
        [OrderStatus.IN_WORK]: { bg: '#ffff00', text: '#000000' },
        [OrderStatus.NIGHT]: { bg: '#1976d2', text: '#ffffff' },
        [OrderStatus.NIGHT_EARLY]: { bg: '#bfe1f6', text: '#000000' },
        [OrderStatus.NEED_CONFIRMATION]: { bg: '#76ff03', text: '#000000' },
        [OrderStatus.NEED_APPROVAL]: { bg: '#ffa726', text: '#000000' },
        [OrderStatus.COMPLETED]: { bg: '#2e7d32', text: '#ffffff' },
        [OrderStatus.CALL_TOMORROW]: { bg: '#e6cff1', text: '#000000' },
        [OrderStatus.ORDER_STATUS]: { bg: '#e0e0e0', text: '#000000' }
    };

    const handleStatusClick = (status: OrderStatus) => {
        if (disabled) return;

        const newStatus = currentSelected === status ? null : status;
        updateFormData("text_status", status)
        if (onStatusChange) {
            onStatusChange(newStatus);
        } else {
            setInternalSelectedStatus(newStatus);
        }
    };

    // Получаем все статусы
    const statuses = Object.values(OrderStatus);

    return (
        <div className="flex flex-wrap gap-2 justify-center p-4 bg-white shadow-sm ">
            {statuses.map((status) => {
                const colors = statusColors[status];
                const isSelected = currentSelected === status;

                return (
                    <button
                        key={status}
                        onClick={() => handleStatusClick(status)}
                        disabled={disabled}

                                className={`
                     px-4 py-2 rounded-full text-xs font-semibold 
                     transition-all duration-200 transform 
                     hover:scale-105 hover:shadow-md
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${isSelected
                                    ? 'shadow-lg scale-105'
                                    : 'hover:shadow-md'
                                }
                   `}
                        style={{
                            backgroundColor: colors.bg,
                            opacity: isSelected ? 1 : 0.3,
                            color: colors.text
                        }}
                    >
                        {status}
                    </button>
                );
            })}
        </div>
    );
}
