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
import {mapOrderToFormPatch} from "@/utils/mapOrderToForm";
import {mapApiServicesToSelected} from "@/utils/mapApiServicesToSelected";
import {serviceCatalog} from "@/catalog/serviceCatalog";

// ===== ИНТЕРФЕЙС ДАННЫХ ФОРМЫ =====
export interface FormData {
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
    currentLeadID?: string;
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
        manager_id: string;
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
    setCurrentUser: (user: { userId: string; userName: string; userAt: string; team: string,manager_id:string }) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
    login: (at:string,password:string) => Promise<void>;
    // ===== ДЕЙСТВИЯ С ГОТОВЫМИ ЗАКАЗАМИ =====
    changeStatus: (status: string,leadId:string) => void;
    initFromStorage: () => void
    updateOrder: (leadId: string | undefined) => void
    getByLeadID: (leadId: string) => Promise<Order | null>;
    patchFormData: (patch: Partial<FormData>) => void;
    // searchOrder: (leadId?: string,phone?:string) => Promise<Order | null>;
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
                set({ currentUser: user }, false, 'setCurrentUser')
                localStorage.setItem('currentUser', JSON.stringify(user))
                ;
            },
            login: async (at, password) => {
                try {
                    const res = await fetch(
                        'https://bot-crm-backend-756832582185.us-central1.run.app/auth/login',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ at, password }),
                        }
                    );

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.message || 'Ошибка входа');
                    }

                    const data = await res.json();
                    set({ currentUser: data.user });

                    sessionStorage.setItem('currentUser', JSON.stringify(data.user))
                } catch (e) {
                    console.error('Login error:', e);
                    throw e;
                }
            },
            initFromStorage: () => {
                const raw = sessionStorage.getItem('currentUser');
                if (raw) {
                    try {
                        const user = JSON.parse(raw);
                        set({ currentUser: user });
                    } catch {
                        sessionStorage.removeItem('currentUser');
                    }
                }
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
                        date: formData.date,
                        time: formData.time,
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

            updateOrder: async (leadId: string) => {
                const { formData, selectedServices, validateForm, currentUser } = get();

                // Валидация
                const errors = validateForm();
                if (errors.length > 0) {
                    set({ error: errors.join(', ') });
                    return null;
                }

                set({ isSaving: true, error: null });

                try {
                    // Преобразуем ServiceItem[] обратно в формат для сервера
                    const orderServices: OrderService[] = selectedServices.map(service =>
                        convertServiceItemToOrderService(service, ['mount'])
                    );

                    // Подготавливаем данные для обновления
                    const updateData = {
                        leadName: formData.customerName,
                        phone: formData.phoneNumber,
                        text_status: formData.text_status,
                        address: formData.address,
                        zip_code: formData.zipCode,
                        date: formData.date,
                        time: formData.time,
                        city: formData.city,
                        manager_id: formData.masterId,
                        master: formData.masterName,
                        comment: formData.description,
                        team: formData.teamId,
                        services: orderServices,
                        total: get().getTotalPrice(),
                        // Добавляем информацию об изменении
                        updatedBy: currentUser?.userAt || '',
                        updatedAt: new Date().toISOString()
                    };

                    // Отправляем запрос на обновление
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/orders/${leadId}`,
                        {
                            method: 'PUT', // или PATCH в зависимости от вашего API
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to update order');
                    }

                    const updatedOrder = await response.json();

                    // Обновляем стор
                    set(state => ({
                        currentOrder: updatedOrder,
                        orders: state.orders.map(o =>
                            o.order_id === leadId ? updatedOrder : o
                        ),
                        myOrders: state.myOrders.map(o =>
                            o.order_id === leadId ? updatedOrder : o
                        ),
                        isSaving: false,
                        error: null
                    }));

                    // Опционально: очищаем форму после успешного обновления
                    // get().resetForm();

                    return updatedOrder;

                } catch (error) {
                    console.error('Update order error:', error);
                    set({
                        error: 'Failed to update order',
                        isSaving: false
                    });
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
                        date: formData.date,
                        time :formData.time,
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
            patchFormData: (patch: Partial<FormData>) =>
                set(s => ({ formData: { ...s.formData, ...patch } }), false, 'patchFormData'),


            getByLeadID: async (leadId: string): Promise<Order | null> => {
                try {
                    set({ isLoading: true, error: null });
                    const res = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/orderByLeadId/${leadId}`
                    );
                    if (!res.ok) throw new Error("Failed to fetch order");

                    const order = (await res.json()) as Order | null;
                    if (!order) { set({ isLoading: false }); return null; }

                    const patch = mapOrderToFormPatch(order);

                    const selected = mapApiServicesToSelected(order.services ?? [], serviceCatalog);

                    // одним батчем
                    set(s => ({
                        formData: { ...s.formData, ...patch },
                        currentLeadID: leadId,
                        selectedServices: selected,
                        currentOrder: order,
                        isLoading: false
                    }), false, "getByLeadID:prefill");

                    return order;
                } catch (error) {
                    console.error(`Error in getByLeadID for leadId=${leadId}:`, error);
                    set({ isLoading: false, error: "Не удалось получить заказ" });
                    return null;
                }
            },


            // ===== ОСТАЛЬНЫЕ ДЕЙСТВИЯ =====
            fetchOrders: async () => {
                set({ isLoading: true, error: null });

                try {
                    let { currentUser } = get();

                    if (!currentUser) {
                        const storageUser = sessionStorage.getItem("currentUser");
                        if (storageUser) {
                            try {
                                currentUser = JSON.parse(storageUser);
                                set({ currentUser });
                            } catch (parseError) {
                                console.error('Invalid user data in sessionStorage:', parseError);
                                sessionStorage.removeItem("currentUser");
                            }
                        }
                    }

                    // Проверяем, есть ли теперь пользователь
                    if (!currentUser) {
                        throw new Error('User not authenticated. Please login.');
                    }

                    // Проверяем наличие userAt
                    if (!currentUser.userAt) {
                        throw new Error('User data is incomplete. Please login again.');
                    }

                    // Убираем "@" если он есть
                    const atClean = currentUser.userAt.startsWith('@')
                        ? currentUser.userAt.slice(1)
                        : currentUser.userAt;

                    // Делаем запрос
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app` +
                        `/api/user/myOrders/${encodeURIComponent(atClean)}`
                    );

                    // Проверяем статус ответа
                    if (!response.ok) {
                        if (response.status === 401) {
                            // Если 401 - пользователь не авторизован на сервере
                            sessionStorage.removeItem("currentUser");
                            set({ currentUser: null });
                            throw new Error('Session expired. Please login again.');
                        }
                        throw new Error(`Failed to fetch orders: ${response.statusText}`);
                    }

                    // Парсим ответ
                    const data = await response.json() as { orders: Order[] };
                    console.log('Orders fetched successfully:', data);

                    // Сохраняем заказы в стор
                    set({
                        orders: data.orders || [],
                        isLoading: false,
                        error: null
                    });

                } catch (error) {
                    console.error('Fetch orders error:', error);

                    // Формируем понятное сообщение об ошибке
                    const errorMessage = error instanceof Error
                        ? error.message
                        : 'Failed to fetch orders. Please try again.';

                    set({
                        error: errorMessage,
                        isLoading: false,
                        orders: []
                    });

                    // Если ошибка авторизации - можно перенаправить на логин
                    if (errorMessage.includes('login') || errorMessage.includes('authenticated')) {
                        // Опционально: перенаправление на страницу логина
                        // window.location.href = '/login';
                    }
                }
            },
            // searchOrder: async (leadId, phone?:string) => {
            //
            // }

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