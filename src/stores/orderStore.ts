// src/stores/orderStore.ts
import { create } from 'zustand';
import { Order } from '@/types/domain';

interface OrderState {
    // Текущий заказ в редактировании
    currentOrder: Order | null;

    // Список заказов
    orders: Order[];

    // Состояния загрузки
    isLoading: boolean;

    // Действия
    setCurrentOrder: (order: Order | null) => void;
    setOrders: (orders: Order[]) => void;
    setLoading: (loading: boolean) => void;

    // Добавить/обновить заказ
    addOrder: (order: Order) => void;
    updateOrder: (id: string, updates: Partial<Order>) => void;
    removeOrder: (id: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
    currentOrder: null,
    orders: [],
    isLoading: false,

    setCurrentOrder: (order: Order | null) => set({ currentOrder: order }),
    setOrders: (orders: Order[]) => set({ orders }),
    setLoading: (isLoading: boolean) => set({ isLoading }),

    addOrder: (order: Order) => set((state) => ({
        orders: [...state.orders, order]
    })),

    updateOrder: (id: string, updates: Partial<Order>) => set((state) => ({
        orders: state.orders.map((order: Order) =>
            order.id === id ? { ...order, ...updates } : order
        )
    })),

    removeOrder: (id: string) => set((state) => ({
        orders: state.orders.filter((order: Order) => order.id !== id)
    }))
}));