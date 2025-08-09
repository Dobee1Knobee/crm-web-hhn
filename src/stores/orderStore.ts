// stores/orderStore.ts - РАБОЧАЯ ВЕРСИЯ
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
    Order,
    CreateOrderData,
    ServiceItem,
    OrderService,
    TransferStatus,
    convertServiceItemToOrderService,
    OrderSearchQuery
} from '@/types/formDataType';
import {state} from "sucrase/dist/types/parser/traverser/base";

// ===== ИНТЕРФЕЙС ДАННЫХ ФОРМЫ =====
interface FormData {
    customerName: string;
    phoneNumber: string;
    text_status : string
    address: string;
    zipCode: string;
    date: string;
    time: string;
    city: string;
    masterId: string;
    masterName: string;
    description: string;
    teamId: string;
}

// ===== КОМАНДНЫЙ БУФЕР =====
interface TeamBufferOrder {
    id: string;
    formData: FormData;
    services: ServiceItem[];
    savedAt: string;
    total: number;
    savedBy: {
        userId: string;
        userName: string;
        userAt: string;
    };
    team: string;
    status: 'available' | 'claimed';
    claimedBy?: {
        userId: string;
        userName: string;
        userAt: string;
        claimedAt: string;
    };
}

// ===== TELEGRAM ЗАКАЗЫ =====
interface TelegramOrder {
    id: string;
    telegramOrderId: string;
    customerName: string;
    phoneNumber: string;
    customerMessage: string;
    acceptedAt: string;
    acceptedBy: {
        userId: string;
        userName: string;
        userAt: string;
    };
    team: string;
    status: 'accepted' | 'in_progress' | 'completed';
}

// ===== ИНТЕРФЕЙС STORE =====
export interface OrderState {
    // ===== ДАННЫЕ =====
    currentOrder: Order | null;
    formData: FormData;
    selectedServices: ServiceItem[];
    orders: Order[];
    teamBufferOrders: TeamBufferOrder[];
    telegramOrders: TelegramOrder[];
    myOrders: Order[];

    // ===== TELEGRAM =====
    currentTelegramOrder: TelegramOrder | null;
    isWorkingOnTelegramOrder: boolean;

    // ===== UI =====
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // ===== ПОЛЬЗОВАТЕЛЬ =====
    currentUser: {
        userId: string;
        userName: string;
        userAt: string;
        team: string;
    } | null;

    // ===== ДЕЙСТВИЯ С ФОРМОЙ =====
    updateFormData: (field: keyof FormData, value: string) => void;
    resetForm: () => void;
    validateForm: () => string[];

    // ===== ДЕЙСТВИЯ С УСЛУГАМИ =====
    addService: (service: ServiceItem, parentMainItemId?: number) => void;
    removeService: (serviceId: string) => void;
    updateServiceQuantity: (orderId: number, newQuantity: number) => void;
    updateServicePrice: (orderId: number, newPrice: number) => void;
    updateServiceDiagonals: (orderId: number, diagonals: string[]) => void;
    updateServiceCustomPrice: (orderId: number, customPrice: number) => void;
    updateSubServiceQuantity: (mainServiceId: number, subServiceId: number, newQuantity: number) => void;
    removeSubService: (mainServiceId: number, subServiceId: number) => void;
    getTotalPrice: () => number;

    // ===== БУФЕРЫ =====
    saveToTeamBuffer: () => Promise<void>;
    fetchTeamBuffer: (team?: string) => Promise<void>;

    // ===== TELEGRAM =====
    fetchTelegramOrders: () => Promise<void>;
    startWorkingOnTelegramOrder: (telegramOrderId: string) => Promise<void>;
    createOrderFromTelegram: () => Promise<Order | null>;
    cancelTelegramOrder: () => void;

    // ===== ЗАКАЗЫ =====
    createOrder: (userOwner: string) => Promise<Order | null>;
    fetchOrders: (query?: OrderSearchQuery) => Promise<void>;
    fetchMyOrders: (owner: string) => Promise<void>;

    // ===== УТИЛИТЫ =====
    setCurrentUser: (user: { userId: string; userName: string; userAt: string; team: string }) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;

    // ===== ДЕЙСТВИЯ С ГОТОВЫМИ ЗАКАЗАМИ =====
    changeStatus: (status: string,leadId:string) => void;
}

// ===== НАЧАЛЬНЫЕ ДАННЫЕ =====
const initialFormData: FormData = {
    customerName: '',
    text_status : "",
    phoneNumber: '',
    address: '',
    zipCode: '',
    date: '',
    time: '',
    city: 'New_York',
    masterId: '',
    masterName: '',
    description: '',
    teamId: 'A'
};

// ===== СОЗДАНИЕ STORE =====
export const useOrderStore = create<OrderState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // ===== НАЧАЛЬНЫЕ ЗНАЧЕНИЯ =====
            currentOrder: null,
            formData: initialFormData,
            selectedServices: [],
            orders: [],
            teamBufferOrders: [],
            telegramOrders: [],
            myOrders: [],
            currentTelegramOrder: null,
            isWorkingOnTelegramOrder: false,
            isLoading: false,
            isSaving: false,
            error: null,
            currentUser: null,

            // ===== ПОЛЬЗОВАТЕЛЬ =====
            setCurrentUser: (user) => {
                set({ currentUser: user }, false, 'setCurrentUser');
            },

            // ===== ФОРМА =====
            updateFormData: (field, value) => {
                set(state => ({
                    formData: { ...state.formData, [field]: value }
                }), false, 'updateFormData');
            },

            resetForm: () => {
                set({
                    formData: initialFormData,
                    selectedServices: [],
                    currentOrder: null,
                    currentTelegramOrder: null,
                    isWorkingOnTelegramOrder: false,
                    error: null
                }, false, 'resetForm');
            },

            validateForm: () => {
                const { formData, selectedServices } = get();
                const errors: string[] = [];

                if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
                selectedServices.forEach(service => {
                    if (service.category === 'main' && service.name !== 'NO TV') {
                        if (!service.diagonals || service.diagonals.length === 0) {
                            errors.push(`TV diagonals are required for ${service.name}`);
                        }
                    }
                    if (service.category === 'main' && service.name === 'NO TV') {
                        if (!service.customPrice) {
                            errors.push('Custom price is required for NO TV service');
                        }
                    }
                });

                return errors;
            },

            // ===== УСЛУГИ =====
            addService: (service, parentMainItemId) => {
                set(state => {
                    const newServices = [...state.selectedServices];

                    if (service.category === 'main' && !parentMainItemId) {
                        const newService: ServiceItem = {
                            ...service,
                            orderId: Math.floor(Date.now() + Math.random() * 1000),
                            quantity: 1,
                            subItems: []
                        };
                        newServices.push(newService);
                    } else if (parentMainItemId && (service.category === 'additional' || service.category === 'materials')) {
                        const mainServiceIndex = newServices.findIndex(s => s.orderId === parentMainItemId);
                        if (mainServiceIndex !== -1) {
                            const mainService = newServices[mainServiceIndex];

                            const updatedSubItems = [...(mainService.subItems || [])];
                            const subItemIndex = updatedSubItems.findIndex(sub => sub.name === service.name);

                            if (subItemIndex !== -1) {
                                updatedSubItems[subItemIndex] = {
                                    ...updatedSubItems[subItemIndex],
                                    quantity: (updatedSubItems[subItemIndex].quantity || 1) + 1
                                };
                            } else {
                                const newSubService: ServiceItem = {
                                    ...service,
                                    orderId: Math.floor(Date.now() + Math.random() * 1000),
                                    quantity: 1,
                                    parentMainItemId
                                };
                                updatedSubItems.push(newSubService);
                            }

                            const updatedMainService = {
                                ...mainService,
                                subItems: updatedSubItems
                            };

                            newServices[mainServiceIndex] = updatedMainService;
                        }
                    }

                    return { selectedServices: newServices };
                }, false, 'addService');
            },


            removeService: (serviceId) => {
                set(state => {
                    let newServices = state.selectedServices.filter(s =>
                        s.orderId?.toString() !== serviceId && s.id !== serviceId
                    );

                    if (newServices.length === state.selectedServices.length) {
                        newServices = state.selectedServices.map(mainService => ({
                            ...mainService,
                            subItems: mainService.subItems?.filter((sub: ServiceItem) =>
                                sub.orderId?.toString() !== serviceId && sub.id !== serviceId
                            ) || []
                        }));
                    }

                    return { selectedServices: newServices };
                }, false, 'removeService');
            },

            updateServiceQuantity: (orderId, newQuantity) => {
                if (newQuantity <= 0) {
                    get().removeService(orderId.toString());
                    return;
                }

                set(state => ({
                    selectedServices: state.selectedServices.map(service =>
                        service.orderId === orderId
                            ? { ...service, quantity: newQuantity }
                            : service
                    )
                }), false, 'updateServiceQuantity');
            },



            updateServicePrice: (orderId, newPrice) => {
                set(state => ({
                    selectedServices: state.selectedServices.map(service =>
                        service.orderId === orderId
                            ? { ...service, price: newPrice }
                            : service
                    )
                }), false, 'updateServicePrice');
            },

            updateServiceDiagonals: (orderId, diagonals) => {
                set(state => ({
                    selectedServices: state.selectedServices.map(service =>
                        service.orderId === orderId
                            ? { ...service, diagonals: diagonals }
                            : service
                    )
                }), false, 'updateServiceDiagonals');
            },

            updateServiceCustomPrice: (orderId, customPrice) => {
                set(state => ({
                    selectedServices: state.selectedServices.map(service =>
                        service.orderId === orderId
                            ? { ...service, customPrice: customPrice }
                            : service
                    )
                }), false, 'updateServiceCustomPrice');
            },

            removeSubService: (mainServiceId, subServiceId) => {
                set(state => ({
                    selectedServices: state.selectedServices.map(mainService =>
                        mainService.orderId === mainServiceId && mainService.subItems
                            ? {
                                ...mainService,
                                subItems: mainService.subItems.filter((sub: ServiceItem) => sub.orderId !== subServiceId)
                            }
                            : mainService
                    )
                }), false, 'removeSubService');
            },

            updateSubServiceQuantity: (mainServiceId, subServiceId, newQuantity) => {
                if (newQuantity <= 0) {
                    get().removeSubService(mainServiceId, subServiceId);
                    return;
                }

                set(state => ({
                    selectedServices: state.selectedServices.map(mainService =>
                        mainService.orderId === mainServiceId && mainService.subItems
                            ? {
                                ...mainService,
                                subItems: mainService.subItems.map((sub: ServiceItem) =>
                                    sub.orderId === subServiceId
                                        ? { ...sub, quantity: newQuantity }
                                        : sub
                                )
                            }
                            : mainService
                    )
                }), false, 'updateSubServiceQuantity');
            },

            getTotalPrice: () => {
                const { selectedServices } = get();
                return selectedServices.reduce((total, service) => {
                    const servicePrice = service.name === "NO TV" && service.customPrice !== undefined
                        ? service.customPrice
                        : service.price;
                    const serviceTotal = servicePrice * (service.quantity || 1);

                    const subItemsTotal = service.subItems ?
                        service.subItems.reduce((subSum: number, subItem: ServiceItem) =>
                            subSum + (subItem.price * (subItem.quantity || 1)), 0
                        ) : 0;

                    return total + serviceTotal + subItemsTotal;
                }, 0);
            },

            // ===== КОМАНДНЫЙ БУФЕР =====
            saveToTeamBuffer: async () => {
                const { formData, selectedServices, currentUser } = get();

                if (!currentUser) {
                    set({ error: 'User not authenticated' });
                    return;
                }

                set({ isSaving: true, error: null });

                try {
                    const teamBufferData: Omit<TeamBufferOrder, 'id'> = {
                        formData,
                        services: selectedServices,
                        savedAt: new Date().toISOString(),
                        total: get().getTotalPrice(),
                        savedBy: {
                            userId: currentUser.userId,
                            userName: currentUser.userName,
                            userAt: currentUser.userAt
                        },
                        team: currentUser.team,
                        status: 'available'
                    };

                    const response = await fetch('/api/buffer/team', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(teamBufferData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save to team buffer');
                    }

                    const savedOrder: TeamBufferOrder = await response.json();

                    set(state => ({
                        teamBufferOrders: [...state.teamBufferOrders, savedOrder],
                        isSaving: false
                    }));

                } catch (error) {
                    console.error('Save to team buffer error:', error);
                    set({ error: 'Failed to save to team buffer', isSaving: false });
                }
            },

            fetchTeamBuffer: async (team) => {
                const { currentUser } = get();
                const teamToFetch = team || currentUser?.team;

                if (!teamToFetch) return;

                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(`/api/buffer/team?team=${teamToFetch}`);

                    if (!response.ok) {
                        throw new Error('Failed to fetch team buffer');
                    }

                    const teamBufferOrders: TeamBufferOrder[] = await response.json();
                    set({ teamBufferOrders, isLoading: false });

                } catch (error) {
                    console.error('Fetch team buffer error:', error);
                    set({ error: 'Failed to fetch team buffer', isLoading: false });
                }
            },

            // ===== TELEGRAM ЗАКАЗЫ =====
            fetchTelegramOrders: async () => {
                const { currentUser } = get();

                if (!currentUser) {
                    set({ error: 'User not authenticated' });
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(`/api/telegram/orders?userId=${currentUser.userId}&team=${currentUser.team}`);

                    if (!response.ok) {
                        throw new Error('Failed to fetch Telegram orders');
                    }

                    const telegramOrders: TelegramOrder[] = await response.json();
                    set({ telegramOrders, isLoading: false });

                } catch (error) {
                    console.error('Fetch Telegram orders error:', error);
                    set({ error: 'Failed to fetch Telegram orders', isLoading: false });
                }
            },

            startWorkingOnTelegramOrder: async (telegramOrderId: string) => {
                const { telegramOrders } = get();

                const telegramOrder = telegramOrders.find(order => order.id === telegramOrderId);

                if (!telegramOrder) {
                    set({ error: 'Telegram order not found' });
                    return;
                }

                set({ isLoading: true, error: null });

                try {
                    const response = await fetch(`/api/telegram/orders/${telegramOrderId}/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to start working on Telegram order');
                    }

                    const prefilledFormData: FormData = {
                        customerName: telegramOrder.customerName,
                        phoneNumber: telegramOrder.phoneNumber,

                        text_status: telegramOrder.status,
                        address: '',
                        zipCode: '',
                        date: '',
                        time: '',
                        city: 'New_York',
                        masterId: '',
                        masterName: '',
                        description: `📝 Сообщение клиента:\n"${telegramOrder.customerMessage}"\n\n🔍 Дополнительная информация:`,
                        teamId: telegramOrder.team
                    };

                    const updatedTelegramOrders = telegramOrders.map(order =>
                        order.id === telegramOrderId
                            ? { ...order, status: 'in_progress' as const }
                            : order
                    );

                    set({
                        formData: prefilledFormData,
                        selectedServices: [],
                        currentTelegramOrder: { ...telegramOrder, status: 'in_progress' },
                        isWorkingOnTelegramOrder: true,
                        telegramOrders: updatedTelegramOrders,
                        isLoading: false
                    });

                } catch (error) {
                    console.error('Start working on Telegram order error:', error);
                    set({ error: 'Failed to start working on Telegram order', isLoading: false });
                }
            },

            createOrderFromTelegram: async () => {
                const { currentTelegramOrder, formData, selectedServices, validateForm, currentUser } = get();

                if (!currentTelegramOrder || !currentUser) {
                    set({ error: 'No Telegram order in progress or user not authenticated' });
                    return null;
                }

                const errors = validateForm();
                if (errors.length > 0) {
                    set({ error: errors.join(', ') });
                    return null;
                }

                set({ isSaving: true, error: null });

                try {
                    const orderServices: OrderService[] = selectedServices.map(service =>
                        convertServiceItemToOrderService(service, ['mount'])
                    );

                    const orderData: CreateOrderData = {
                        owner: currentUser.userId,
                        team: formData.teamId,
                        leadName: formData.customerName,
                        phone: formData.phoneNumber,
                        address: formData.address,
                        zip_code: formData.zipCode,
                        city: formData.city,
                        date: `${formData.date} ${formData.time}`,
                        master: formData.masterName,
                        manager_id: formData.masterId,
                        comment: formData.description,
                        comments: `Заказ из Telegram. Исходное сообщение клиента: "${currentTelegramOrder.customerMessage}"`,
                        services: orderServices,
                        total: get().getTotalPrice(),
                        transfer_status: TransferStatus.ACTIVE,
                        canceled: false,
                        miles: [],
                        response_time: [],
                        visits: [],
                        transfer_history: [],
                        changes: []
                    };

                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create order');
                    }

                    const createdOrder: Order = await response.json();

                    await fetch(`/api/telegram/orders/${currentTelegramOrder.id}/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: createdOrder._id })
                    });

                    set(state => ({
                        currentOrder: createdOrder,
                        myOrders: [...state.myOrders, createdOrder],
                        currentTelegramOrder: null,
                        isWorkingOnTelegramOrder: false,
                        telegramOrders: state.telegramOrders.map(order =>
                            order.id === currentTelegramOrder.id
                                ? { ...order, status: 'completed' as const }
                                : order
                        ),
                        isSaving: false
                    }));

                    get().resetForm();
                    return createdOrder;

                } catch (error) {
                    console.error('Create order from Telegram error:', error);
                    set({ error: 'Failed to create order from Telegram', isSaving: false });
                    return null;
                }
            },

            cancelTelegramOrder: () => {
                const { currentTelegramOrder } = get();

                if (!currentTelegramOrder) return;

                set(state => ({
                    currentTelegramOrder: null,
                    isWorkingOnTelegramOrder: false,
                    telegramOrders: state.telegramOrders.map(order =>
                        order.id === currentTelegramOrder.id
                            ? { ...order, status: 'accepted' as const }
                            : order
                    )
                }));

                get().resetForm();
            },

            // ===== СОЗДАНИЕ ЗАКАЗА =====
            createOrder: async (userOwner) => {
                if (get().isWorkingOnTelegramOrder) {
                    return get().createOrderFromTelegram();
                }

                const { formData, selectedServices, validateForm } = get();

                const errors = validateForm();
                if (errors.length > 0) {
                    set({ error: errors.join(', ') });
                    return null;
                }

                set({ isSaving: true, error: null });

                try {
                    const orderServices: OrderService[] = selectedServices.map(service =>
                        convertServiceItemToOrderService(service, ['mount'])
                    );

                    const orderData: CreateOrderData = {
                        owner: userOwner,
                        team: formData.teamId,
                        leadName: formData.customerName,
                        phone: formData.phoneNumber,
                        address: formData.address,
                        zip_code: formData.zipCode,
                        city: formData.city,
                        date: `${formData.date} ${formData.time}`,
                        master: formData.masterName,
                        manager_id: formData.masterId,
                        comment: formData.description,
                        services: orderServices,
                        text_status : formData.text_status,
                        total: get().getTotalPrice(),
                        transfer_status: TransferStatus.ACTIVE,
                        canceled: false,
                        miles: [],
                        response_time: [],
                        visits: [],
                        transfer_history: [],
                        changes: []
                    };
                    console.log(orderData);

                    const response = await fetch('https://bot-crm-backend-756832582185.us-central1.run.app/api/addOrder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create order');
                    }

                    const createdOrder: Order = await response.json();

                    set(state => ({
                        currentOrder: createdOrder,
                        myOrders: [...state.myOrders, createdOrder],
                        isSaving: false
                    }));

                    get().resetForm();
                    return createdOrder;

                } catch (error) {
                    console.error('Create order error:', error);
                    set({ error: 'Failed to create order', isSaving: false });
                    return null;
                }
            },

            // ===== ОСТАЛЬНЫЕ ДЕЙСТВИЯ =====
            fetchOrders: async () => {
                set({ isLoading: true, error: null });

                try {
                    const { currentUser } = get();
                    if (!currentUser) {
                        throw new Error('User not authenticated');
                    }

                    // Убираем "@" если он есть
                    const atClean = currentUser.userAt.startsWith('@')
                        ? currentUser.userAt.slice(1)
                        : currentUser.userAt;

                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app` +
                        `/api/user/myOrders/${encodeURIComponent(atClean)}`
                    );
                    if (!response.ok) {
                        throw new Error('Failed to fetch orders');
                    }

                    const data = await response.json() as { orders: Order[] };
                    console.log(data)
                    set({ orders: data.orders, isLoading: false });
                } catch (error) {
                    console.error('Fetch orders error:', error);
                    set({ error: 'Failed to fetch orders', isLoading: false });
                }
            },



            fetchMyOrders: async (owner) => {
                await get().fetchOrders({ owner, transfer_status: TransferStatus.ACTIVE });
                set(state => ({ myOrders: state.orders }));
            },
// В интерфейсе:

            changeStatus: async (status, leadId) => {
                set({ isSaving: true, error: null }, false, 'changeStatus:start');
                try {
                    // Если нужно логировать, кто меняет статус
                    const at = get().currentUser?.userAt?.replace(/^@/, '');

                    const res = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/orders/${encodeURIComponent(leadId)}/status`,
                        {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text_status: status, owner: at })
                        }
                    );
                    if (!res.ok) throw new Error('Failed to update status');

                    const json = await res.json(); // { success, message, order }
                    const updated = json.order;
                    console.log(updated);

                    // Оптимистично обновляем локальные списки
                    set(state => ({
                        orders: state.orders.map(o =>
                            o.order_id === leadId ? { ...o, text_status: updated?.text_status ?? status } : o
                        ),
                        myOrders: state.myOrders.map(o =>
                            o.order_id === leadId ? { ...o, text_status: updated?.text_status ?? status } : o
                        ),
                        currentOrder:
                            state.currentOrder?.order_id === leadId
                                ? { ...state.currentOrder, text_status: updated?.text_status ?? status }
                                : state.currentOrder,
                        isSaving: false
                    }), false, 'changeStatus:success');
                } catch (e) {
                    console.error('changeStatus error', e);
                    set({ isSaving: false, error: 'Не удалось обновить статус' }, false, 'changeStatus:error');
                }
            },
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),

            reset: () => set({
                currentOrder: null,
                formData: initialFormData,
                selectedServices: [],
                orders: [],
                teamBufferOrders: [],
                telegramOrders: [],
                myOrders: [],
                currentTelegramOrder: null,
                isWorkingOnTelegramOrder: false,
                isLoading: false,
                isSaving: false,
                error: null
            })
        })),
        {
            name: 'order-store',
            version: 1,
        }
    )
);