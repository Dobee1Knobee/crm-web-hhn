// stores/orderStore.ts - ПОЛНАЯ РАБОЧАЯ ВЕРСИЯ С WEBSOCKET И БУФЕРОМ
import { serviceCatalog } from "@/catalog/serviceCatalog"
import {
    convertServiceItemToOrderService,
    CreateOrderData,
    Order,
    OrderSearchQuery,
    OrderService,
    ServiceItem,
    TransferStatus
} from '@/types/formDataType'
import { mapApiServicesToSelected } from "@/utils/mapApiServicesToSelected"
import { mapOrderToFormPatch } from "@/utils/mapOrderToForm"
import toast from "react-hot-toast"
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// === SOCKET CONFIG ===
const SOCKET_URL =
    (process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || 'https://bot-crm-backend-756832582185.us-central1.run.app')
        .replace(/\/+$/, ''); // обрежем хвостовые слэши

// Жёсткая проверка, чтобы не получить "http://http/..."
if (!/^https?:\/\//i.test(SOCKET_URL)) {
    console.error('⚠ Некорректный NEXT_PUBLIC_SOCKET_URL:', SOCKET_URL);
}

// ===== ИНТЕРФЕЙС ДАННЫХ ФОРМЫ =====
export interface FormData {
    customerName: string;
    phoneNumber: string;
    text_status: string;
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

// ===== ПАГИНАЦИЯ =====
interface PaginationParams {
    page?: number;
    limit?: number;
}

interface PaginationInfo {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

interface FetchOrdersResponse {
    success: boolean;
    orders: Order[];
    count: number;
    pagination: PaginationInfo;
}

// ===== ИНТЕРФЕЙСЫ БУФЕРА =====
interface TransferredFrom {
    user_name: string;
    user_at: string;
    team: string;
    date: string;
}

interface OrderData {
    transferred_from: TransferredFrom;
    order_id: string;
    transfer_status: string;
    transferred_to_team: string;
    transfer_note: string;
    transferred_at: string;
    total:number;
}

export interface OrderBuffer {
    data: OrderData;
    _id: string;
    order_id: string;
    document_id: string;
    status: string;
    created_at: string;
    createdAt: string;
    updatedAt: string;
    total: number;
    __v: number;
}

interface UserInfo {
    userId: string;
    userName: string;
    userAt: string;
}

interface ClaimedBy extends UserInfo {
    claimedAt: string;
}

interface TeamBufferOrder {
    success: boolean;
    my_team: string;
    orders: OrderBuffer[];
    savedAt: string;
    total: number;
    savedBy: UserInfo;
    team: string;
    status: 'available' | 'claimed';
    claimedBy?: ClaimedBy;
}

interface CurrentOrderBufferResponse {
    success: boolean;
    my_team: string;
    orders: OrderBuffer[];
    count: number;
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
interface CorrectCityResponse {
    address_data : { 
        address:string;
        data:{
            city?: string;        // Может отсутствовать
            town?: string;        // Альтернатива городу
            country:string;
            county : string,
            house_number:string,
            postcode:string,
            road:string,
            state:string,
        },
        nearest_cities:[{
            distance:number;
            name:string;
            team:string;
        }];
    };
    fit: boolean;
    nearest_team: string;
}

// ===== СОСТОЯНИЕ БУФЕРА =====
// Разделенные заказы
interface BufferState {
    internalOrders: OrderBuffer[];    // Заказы от нашей команды
    externalOrders: OrderBuffer[];    // Заказы от других команд
    allBufferOrders: OrderBuffer[];   // Все заказы из буфера
    
    bufferStats: {
        totalCount: number;
        internalCount: number;
        externalCount: number;
        lastUpdated: string | null;
    };
    
    isLoadingBuffer: boolean;
    bufferError: string | null;
}

// ===== ИНТЕРФЕЙС STORE =====
export interface OrderState extends BufferState {
    // ===== ДАННЫЕ =====
    currentOrder: Order | null;
    formData: FormData;
    selectedServices: ServiceItem[];
    orders: Order[];
    teamBufferOrders: TeamBufferOrder[];
    myOrders: Order[];
    currentLeadID?: string;

    // ===== ПАГИНАЦИЯ =====
    pagination: PaginationInfo | null;
    currentPage: number;
    ordersPerPage: number;

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

    // ===== 🆕 WEBSOCKET ПОЛЯ =====
    socket: any | null;
    isSocketConnected: boolean;
    notifications: Array<{
        id: number;
        type: string;
        form_id?: string; // Делаем опциональным
        title: string;
        message: string;
        order_id?: string;
        transferred_from?: string;
        timestamp: Date;
        read: boolean;
    }>;

    // ===== 🆕 АДРЕСНЫЕ УВЕДОМЛЕНИЯ =====
    addressFitNotification: {
        isVisible: boolean;
        message: string;
        nearestTeam: string;
        address: string;
        orderId?: string; // ID текущего заказа для передачи в буфер
        phoneNumber?: string; // Номер телефона для проверки возможности создания заказа
    } | null;

                // ===== 🆕 WEBSOCKET ДЕЙСТВИЯ =====
            connectSocket: () => void;

            // ===== 🆕 АДРЕСНЫЕ УВЕДОМЛЕНИЯ =====
            showAddressFitNotification: (message: string, nearestTeam: string, address: string) => void;
            hideAddressFitNotification: () => void;
    disconnectSocket: () => void;
    markNotificationAsRead: (notificationId: number) => void;
    clearNotifications: () => void;
    getUnreadNotificationsCount: () => number;

    // ===== ДЕЙСТВИЯ С ФОРМОЙ =====
    updateFormData: (field: keyof FormData, value: string) => void;
    resetForm: () => void;
    validateForm: () => string[];
    getCorrectCity: (address:string) => Promise<CorrectCityResponse>;

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

    // ===== 🆕 НОВЫЕ МЕТОДЫ ДЛЯ БУФЕРА =====
    fetchBufferOrders: () => Promise<void>;
    claimBufferOrder: (orderId: string, team: string | undefined) => Promise<boolean>;
    transferOrderToBuffer: (orderId: string, targetTeam: string | undefined, note?: string | undefined) => Promise<boolean>;
    refreshBuffer: () => Promise<void>;
    clearBuffer: () => void;
    takeOrderBackFromBuffer: (orderId: string, team: string | undefined) => Promise<boolean>;  // 🆕 НОВЫЙ МЕТОД
    takeOrderFromBuffer: (orderId: string) => Promise<boolean>;      // 🆕 НОВЫЙ МЕТОД

    // Геттеры для удобства
    getInternalBufferOrders: () => OrderBuffer[];
    getExternalBufferOrders: () => OrderBuffer[];
    getBufferOrderById: (orderId: string) => OrderBuffer | null;

    // Фильтрация
    filterBufferOrders: (filter: 'all' | 'internal' | 'external') => OrderBuffer[];

    // ===== ЗАКАЗЫ =====
    createOrder: (userOwner?: string) => Promise<Order | null>;
    fetchOrders: (paginationParams?: PaginationParams, query?: OrderSearchQuery) => Promise<FetchOrdersResponse | void>;
    fetchMyOrders: (owner: string) => Promise<void>;
    checkDoubleOrders: (phoneNumber: string) => Promise<Order[]>;

    // ===== ПОИСК ======
    searchResults: {
        allOrders: Order[];
        myOrders: Order[];
        notMyOrders: Order[];
        counts: {
            total: number;
            my: number;
            notMy: number;
        };
        searchType: string;
        searchQuery: string;
        searchedBy: string;
    } | null;
    isSearching: boolean;

    // ===== ПАГИНАЦИЯ =====
    fetchNextPage: () => Promise<void>;
    fetchPrevPage: () => Promise<void>;
    fetchPage: (page: number) => Promise<void>;
    changePageSize: (limit: number) => Promise<void>;
    getTotalPages: () => number;
    getTotalOrders: () => number;
    hasNextPage: () => boolean;
    hasPrevPage: () => boolean;

    // ===== УТИЛИТЫ =====
    setCurrentUser: (user: { userId: string; userName: string; userAt: string; team: string; manager_id: string }) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
    login: (at: string, password: string) => Promise<void>;

    // ===== ДЕЙСТВИЯ С ГОТОВЫМИ ЗАКАЗАМИ =====
    changeStatus: (status: string, leadId: string) => void;
    initFromStorage: () => void;
    updateOrder: (leadId: string | undefined) => void;
    getByLeadID: (leadId: string) => Promise<Order | null>;
    patchFormData: (patch: Partial<FormData>) => void;

    // ===== ФУНКЦИИ ПОИСКА =====
    searchOrders: (query: string) => Promise<void>;
    clearSearchResults: () => void;
    viewNotMyOrder: (orderId: string) => Promise<void>;
}

// ===== НАЧАЛЬНЫЕ ДАННЫЕ =====
const initialFormData: FormData = {
    customerName: '',
    text_status: "",
    phoneNumber: '',
    address: '',
    zipCode: '',
    date: '',
    time: '',
    city: 'New_York',
    masterId: '',
    masterName: '',
    description: '',
    teamId: 'Init'
};

// ===== СОЗДАНИЕ STORE =====
export const useOrderStore = create<OrderState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // ===== НАЧАЛЬНЫЕ ЗНАЧЕНИЯ =====
            currentOrder: null,
            addressFitNotification: null,
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

            // ===== ПАГИНАЦИЯ =====
            pagination: null,
            currentPage: 1,
            ordersPerPage: 10,

            // ===== 🆕 WEBSOCKET НАЧАЛЬНЫЕ ЗНАЧЕНИЯ =====
            socket: null,
            isSocketConnected: false,
            notifications: [],

            // ===== 🆕 БУФЕР НАЧАЛЬНЫЕ ЗНАЧЕНИЯ =====
            internalOrders: [],
            externalOrders: [],
            allBufferOrders: [],
            bufferStats: {
                totalCount: 0,
                internalCount: 0,
                externalCount: 0,
                lastUpdated: null
            },
            isLoadingBuffer: false,
            bufferError: null,

            // ===== ПОИСК =====
            searchResults: null,
            isSearching: false,

            // ===== 🆕 АДРЕСНЫЕ УВЕДОМЛЕНИЯ =====
            showAddressFitNotification: (message: string, nearestTeam: string, address: string, orderId?: string, phoneNumber?: string) => {
                set({
                    addressFitNotification: {
                        isVisible: true,
                        message,
                        nearestTeam,
                        address,
                        orderId,
                        phoneNumber
                    }
                }, false, 'showAddressFitNotification');
            },

            hideAddressFitNotification: () => {
                set({ addressFitNotification: null }, false, 'hideAddressFitNotification');
            },

            // Передача заказа в буфер другой команды
            transferOrderToBuffer: async (orderId: string, targetTeam: string, note?: string) => {
                const { currentUser } = get();
                if (!currentUser) {
                    throw new Error('Пользователь не авторизован');
                }

                try {
                    const response = await fetch('https://bot-crm-backend-756832582185.us-central1.run.app/orders/transfer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            order_id: orderId,
                            from_team: currentUser.team,
                            to_team: targetTeam,
                            from_user: currentUser.userAt,
                            note: note || `Автоматическая передача: адрес не подходит для команды ${currentUser.team}`
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Ошибка передачи: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log('Заказ успешно передан в буфер:', result);
                    
                    // Обновляем локальное состояние
                    get().fetchOrders();
                    get().fetchBufferOrders();
                    
                    return result;
                } catch (error) {
                    console.error('Ошибка передачи заказа в буфер:', error);
                    throw error;
                }
            },

            // ===== 🆕 WEBSOCKET ДЕЙСТВИЯ =====
            connectSocket: () => {
                const state = get();
                const { currentUser } = state;

                // Проверяем, есть ли пользователь
                if (!currentUser || !currentUser.team || !currentUser.userName) {
                    console.log('⚠ Нет данных пользователя для WebSocket');
                    return;
                }

                // Если уже подключены - не подключаемся снова
                if (state.socket && state.isSocketConnected) {
                    console.log('⚡ WebSocket уже подключен');
                    return;
                }

                // Закрываем предыдущее соединение если есть
                if (state.socket) {
                    state.socket.disconnect();
                }

                console.log(`🔌 Подключаемся как ${currentUser.userName} к команде ${currentUser.team}`);

                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const io = require('socket.io-client');
                console.log('🔗 SOCKET_URL =', SOCKET_URL);

                const socket = io(SOCKET_URL, {
                    transports: ['websocket'],
                    path: '/socket.io',
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                });

                // Обработчики событий
                socket.on('connect', () => {
                    console.log('✅ WebSocket подключен!', socket.id);
                    set({ isSocketConnected: true });

                    socket.emit('join-team', {
                        team: currentUser.team,
                        username: currentUser.userName,
                        at:currentUser.userAt
                    });

                    // Регистрируем менеджера для таргетных уведомлений
                    socket.emit('register-manager', {
                        manager_id: currentUser.manager_id,
                        at: currentUser.userAt,
                        user_id: currentUser.userId,
                        socket_id: socket.id
                    });

                    // Запрашиваем разрешение на системные уведомления (один раз)
                    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                        try { Notification.requestPermission(); } catch {}
                    }
                });

                socket.on('team-joined', (data: any) => {
                    console.log('🎉 Присоединились к команде:', data);
                });

                // 🎯 Таргетные уведомления для конкретного менеджера
                socket.on('target-notification', (data: any) => {
                    try {
                        const notification = {
                            id: Date.now(),
                            type: 'target-notification',
                            form_id: data?.form_id,
                            title: data?.title || 'Новое уведомление',
                            message: data?.message || 'У вас новое уведомление',
                            order_id: data?.order_id,
                            transferred_from: data?.from,
                            timestamp: new Date(),
                            read: false
                        };

                        // UI тост
                        if (data?.title || data?.message) {
                            toast(data?.title ? `${data.title}: ${data.message}` : data.message, {
                                icon: '🔔'
                            });
                        } else {
                            toast('🔔 Новое уведомление');
                        }

                        // Сохраняем в store
                        set(state => ({
                            notifications: [notification, ...state.notifications]
                        }));

                        // Системное уведомление браузера (если разрешено)
                        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                            const body = notification.message || 'У вас новое уведомление';
                            new Notification(notification.title, {
                                body,
                                icon: '/favicon.ico'
                            });
                        }
                    } catch (e) {
                        console.error('Ошибка обработки target-notification:', e, data);
                    }
                });

                socket.on('new-order-in-buffer', (data: any) => {
                    toast.success('🔔 НОВЫЙ ЗАКАЗ В БУФЕРЕ!');
                    const notification = {
                        id: Date.now(),
                        type: 'new-order',
                        title: 'Новый заказ в буфере',
                        message: data.message,
                        form_id: data.order_id || '', // Добавляем form_id
                        order_id: data.order_id,
                        transferred_from: data.transferred_from,
                        timestamp: new Date(),
                        read: false
                    };

                    // Добавляем уведомление в store
                    set(state => ({
                        notifications: [notification, ...state.notifications]
                    }));

                    // Браузерное уведомление (если разрешено)
                    if (Notification.permission === 'granted') {
                        new Notification(notification.title, {
                            body: notification.message,
                            icon: '/favicon.ico'
                        });
                    }

                    // Автоматически обновляем буфер
                    get().refreshBuffer();
                });

                socket.on('disconnect', () => {
                    console.log('⚠ WebSocket отключен');
                    set({ isSocketConnected: false });
                });

                socket.on('error', (error: any) => {
                    console.error('WebSocket ошибка:', error);
                });

                // Сохраняем socket в store
                set({ socket });
            },

            disconnectSocket: () => {
                const { socket } = get();
                if (socket) {
                    console.log('🔌 Закрываем WebSocket соединение');
                    socket.disconnect();
                    set({
                        socket: null,
                        isSocketConnected: false
                    });
                }
            },

            markNotificationAsRead: (notificationId: number) => {
                set(state => ({
                    notifications: state.notifications.map(notification =>
                        notification.id === notificationId
                            ? { ...notification, read: true }
                            : notification
                    )
                }));
            },

            clearNotifications: () => {
                set({ notifications: [] });
            },

            getUnreadNotificationsCount: () => {
                const { notifications } = get();
                return notifications.filter(n => !n.read).length;
            },

            // ===== 🆕 МЕТОДЫ БУФЕРА =====
            fetchBufferOrders: async () => {
                const { currentUser } = get();

                if (!currentUser?.team) {
                    set({ bufferError: 'Команда пользователя не определена' });
                    return;
                }

                set({ isLoadingBuffer: true, bufferError: null });

                try {
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/show-orders-otherteam/buffer/${currentUser.userAt}`,
                    );

                    if (!response.ok) {
                        throw new Error(`Ошибка загрузки буфера: ${response.statusText}`);
                    }

                    const data: CurrentOrderBufferResponse = await response.json();

                    if (!data.success) {
                        throw new Error('Сервер вернул ошибку');
                    }

                    const allOrders = data.orders || [];
                    const currentTeam = currentUser.team;

                    // Разделяем заказы на внутренние и внешние
                    const internalOrders = allOrders.filter(order =>
                        order.data.transferred_from.team === currentTeam
                    );

                    const externalOrders = allOrders.filter(order =>
                        order.data.transferred_from.team !== currentTeam
                    );

                    // Обновляем статистику
                    const bufferStats = {
                        totalCount: allOrders.length,
                        internalCount: internalOrders.length,
                        externalCount: externalOrders.length,
                        lastUpdated: new Date().toISOString()
                    };

                    set({
                        allBufferOrders: allOrders,
                        internalOrders,
                        externalOrders,
                        bufferStats,
                        isLoadingBuffer: false,
                        bufferError: null
                    });

                    console.log(`📊 Буфер обновлен: ${bufferStats.totalCount} заказов (${bufferStats.internalCount} внутренних, ${bufferStats.externalCount} внешних)`);

                } catch (error) {
                    console.error('Ошибка загрузки буфера:', error);
                    set({
                        bufferError: error instanceof Error ? error.message : 'Неизвестная ошибка',
                        isLoadingBuffer: false
                    });
                }
            },

            claimBufferOrder: async (orderId: string,team?:string) => {
                const { currentUser } = get();

                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return false;
                }

                try {
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/takeOrderFromBuffer/${orderId}/${currentUser.userAt}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ team })

                        }
                    );

                    if (!response.ok) {
                        throw new Error('Не удалось забрать заказ');
                    }

                    // Обновляем буфер после успешного клейма
                    await get().refreshBuffer();
                    toast.success('Заказ успешно забран!');
                    return true;

                } catch (error) {
                    console.error('Ошибка при заборе заказа:', error);
                    toast.error('Не удалось забрать заказ');
                    return false;
                }
            },

            transferOrderToBuffer: async (orderId: string, targetTeam: string | undefined, note = '') => {
                const { currentUser } = get();

                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return false;
                }

                if (!orderId || orderId === 'undefined') {
                    console.error('Invalid orderId:', orderId);
                    set({ bufferError: 'Неверный ID заказа' });
                    return false;
                }

                console.log(`🔄 Передаем заказ ${orderId} в команду ${targetTeam} пользователем ${currentUser.userAt}`);

                try {
                    // ✅ Исправлен URL с правильными query параметрами
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/transfer-order/?leadId=${orderId}&toTeam=${targetTeam}&at=${currentUser.userAt}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                transfer_note: note // ✅ Исправлено название поля
                            })
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Не удалось перевести заказ в буфер');
                    }

                    const result = await response.json();
                    return true;

                } catch (error) {
                    console.error('Ошибка перевода в буфер:', error);
                    toast.error(error instanceof Error ? error.message : 'Не удалось перевести заказ');
                    return false;
                }
            },

            // 🆕 НОВЫЙ МЕТОД: Возврат заказа из буфера
            takeOrderBackFromBuffer: async (orderId: string,team?:string) => {
                const { currentUser } = get();
                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return false;
                }
                try {
                    console.log(`🔄 Возвращаем заказ ${orderId} пользователем ${currentUser.userAt}`);

                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/take-order-back/?leadId=${orderId}&at=${currentUser.userAt}&team=${team}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ team })
                        }
                    );
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Не удалось вернуть заказ');
                    }
                    const result = await response.json();
                    // Обновляем буфер и заказы после успешного возврата
                    await get().refreshBuffer();
                    await get().fetchOrders(); // Обновляем список основных заказов

                    console.log('✅ Заказ успешно возвращен:', result);

                    return true;

                } catch (error) {
                    console.error('❌ Ошибка при возврате заказа:', error);
                    toast.error(error instanceof Error ? error.message : 'Не удалось вернуть заказ');
                    return false;
                }
            },

            // 🆕 НОВЫЙ МЕТОД: Забор заказа из буфера с новым leadId
            takeOrderFromBuffer: async (orderId: string) => {
                const { currentUser } = get();

                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return false;
                }

                try {
                    console.log(`📦 Забираем заказ ${orderId} пользователем ${currentUser.userAt}`);

                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/takeOrderFromBuffer/${orderId}/${currentUser.userAt}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Не удалось забрать заказ из буфера');
                    }

                    const result = await response.json();

                    // Обновляем буфер и заказы после успешного забора
                    await get().refreshBuffer();
                    await get().fetchOrders(); // Обновляем список основных заказов

                    toast.success(`Заказ успешно забран! Новый leadId: ${result.data.new_order_id}`);
                    console.log('✅ Заказ успешно забран из буфера:', result);

                    return true;

                } catch (error) {
                    console.error('❌ Ошибка при заборе заказа из буфера:', error);
                    toast.error(error instanceof Error ? error.message : 'Не удалось забрать заказ');
                    return false;
                }
            },

            refreshBuffer: async () => {
                await get().fetchBufferOrders();
            },

            clearBuffer: () => {
                set({
                    allBufferOrders: [],
                    internalOrders: [],
                    externalOrders: [],
                    bufferStats: {
                        totalCount: 0,
                        internalCount: 0,
                        externalCount: 0,
                        lastUpdated: null
                    },
                    bufferError: null
                });
            },

            // ===== ГЕТТЕРЫ ДЛЯ БУФЕРА =====
            getInternalBufferOrders: () => {
                return get().internalOrders;
            },

            getExternalBufferOrders: () => {
                return get().externalOrders;
            },

            getBufferOrderById: (orderId: string) => {
                const { allBufferOrders } = get();
                return allBufferOrders.find(order =>
                    order.order_id === orderId || order._id === orderId
                ) || null;
            },
            getCorrectCity: async (address: string): Promise<CorrectCityResponse> => {
                const user = get().currentUser;
                
                if (!user?.team) {
                    throw new Error('Команда пользователя не определена');
                }
                
                try {
                    const response = await fetch(`https://tvmountmaster.ngrok.dev/get_address`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            client_address: address,
                            team: user.team
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    
                    const data: CorrectCityResponse = await response.json();
                    
                    // Проверяем поле fit и показываем уведомление если false
                    if (!data.fit) {
                        const message = `Address doesn't match your team. Recommended to transfer order to team ${data.nearest_team}`;
                        // Получаем текущий orderId и номер телефона из формы (если есть)
                        const currentOrderId = get().currentOrder?._id || get().currentLeadID;
                        const currentPhoneNumber = get().formData.phoneNumber;
                        get().showAddressFitNotification(message, data.nearest_team, address, currentOrderId, currentPhoneNumber);
                    } else {
                        // ===== ЛОГИКА ОБНОВЛЕНИЯ ГОРОДА/ШТАТА ДЛЯ ПОДХОДЯЩИХ АДРЕСОВ =====
                        // Приоритет: city > town > state (с проверкой совпадения)
                        let cityToUse = '';
                        let shouldShowManualSelection = false;
                        
                        console.log('🔍 Processing suitable address - Address data received:', {
                            city: data.address_data.data.city,
                            state: data.address_data.data.state,
                            postcode: data.address_data.data.postcode
                        });
                        
                        // Проверяем, есть ли город в ответе (приоритет: city > state, town не используем)
                        if (data.address_data.data.city) {
                            cityToUse = data.address_data.data.city;
                            console.log('✅ Using city from API:', cityToUse);
                        } 
                        // Если города нет, но есть штат - проверяем совпадение
                        else if (data.address_data.data.state) {
                            const stateName = data.address_data.data.state;
                            console.log('🔍 Checking if state matches available cities:', stateName);
                            
                            // Получаем список доступных городов для команды
                            try {
                                console.log(`🔍 Fetching available cities for team: ${user.team}`);
                                const citiesResponse = await fetch(
                                    `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getCitiesByTeam?team=${user.team}`
                                );
                                
                                if (citiesResponse.ok) {
                                    const citiesData = await citiesResponse.json();
                                    const availableCities = citiesData.cities || [];
                                    
                                    console.log('🏙️ Available cities for team:', availableCities.map((c: any) => c.name));
                                    console.log(`🔍 Comparing state "${stateName}" with available cities...`);
                                    
                                    // Проверяем, есть ли совпадение state с доступными городами
                                    const stateMatchesCity = availableCities.some((city: any) => {
                                        const cityName = city.name?.toLowerCase();
                                        const stateNameLower = stateName.toLowerCase();
                                        const matches = cityName === stateNameLower;
                                        console.log(`  ${cityName} === ${stateNameLower} ? ${matches}`);
                                        return matches;
                                    });
                                    
                                    if (stateMatchesCity) {
                                        cityToUse = stateName;
                                        console.log('✅ State matches available city, using state:', cityToUse);
                                    } else {
                                        console.log('❌ State does not match any available city');
                                        shouldShowManualSelection = true;
                                    }
                                } else {
                                    console.log('❌ Failed to fetch available cities:', citiesResponse.status);
                                    shouldShowManualSelection = true;
                                }
                            } catch (error) {
                                console.error('❌ Error fetching available cities:', error);
                                shouldShowManualSelection = true;
                            }
                        }
                        
                        // Обновляем данные только если у нас есть что обновлять
                        if (cityToUse) {
                            console.log('🔄 Before update - Current formData.city:', get().formData.city);
                            get().updateFormData('city', cityToUse);
                            get().updateFormData('zipCode', data.address_data.data.postcode || '');
                            console.log('✅ Updated form data with:', { 
                                city: cityToUse, 
                                zipCode: data.address_data.data.postcode 
                            });
                        } else if (shouldShowManualSelection) {
                            console.log('❌ No suitable city found, showing manual selection message');
                            toast.error(`City not detected automatically. 
                                State "${data.address_data.data.state}" doesn't match available cities for team ${user.team}. 
                                Please select city manually.`);
                        } else {
                            console.log('❌ No city, town, or state found, keeping original form data unchanged');
                        }
                    }
                    
                    return data; 
                    
                } catch (error) {
                    console.error('Error getting correct city:', error);
                    throw error; 
                }
            },
            filterBufferOrders: (filter: 'all' | 'internal' | 'external') => {
                const { allBufferOrders, internalOrders, externalOrders } = get();

                switch (filter) {
                    case 'internal':
                        return internalOrders;
                    case 'external':
                        return externalOrders;
                    case 'all':
                    default:
                        return allBufferOrders;
                }
            },

            // ===== ПОЛЬЗОВАТЕЛЬ С АВТОПОДКЛЮЧЕНИЕМ WEBSOCKET =====
            setCurrentUser: (user) => {
                set({ currentUser: user }, false, 'setCurrentUser');
                localStorage.setItem('currentUser', JSON.stringify(user));

                // 🆕 АВТОМАТИЧЕСКИ ПОДКЛЮЧАЕМ WEBSOCKET после установки пользователя
                setTimeout(() => {
                    get().connectSocket();
                    // Также загружаем буфер
                    get().fetchBufferOrders();
                }, 100);
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
                    sessionStorage.setItem('currentUser', JSON.stringify(data.user));

                    // 🆕 ПОДКЛЮЧАЕМ WEBSOCKET после успешного логина
                    setTimeout(() => {
                        get().connectSocket();
                        get().fetchBufferOrders();
                    }, 100);

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

                        // 🆕 АВТОПОДКЛЮЧЕНИЕ WEBSOCKET при инициализации
                        setTimeout(() => {
                            get().connectSocket();
                            get().fetchBufferOrders();
                        }, 100);
                    } catch {
                        sessionStorage.removeItem('currentUser');
                    }
                }
            },

            // ===== ФОРМЫ =====
            updateFormData: (field, value) => {
                console.log(`🔄 updateFormData called: ${field} = ${value}`);
                if (field === 'city') {
                    console.log(`🏙️ City update: ${value} (previous: ${get().formData.city})`);
                }
                set(state => ({
                    formData: { ...state.formData, [field]: value }
                }), false, 'updateFormData');
            },

            resetForm: () => {
                console.log('🔄 resetForm called - resetting all form data');
                set({
                    formData: initialFormData,
                    selectedServices: [],
                    currentOrder: null,
                    currentTelegramOrder: null,
                    isWorkingOnTelegramOrder: false,
                    error: null,
                    addressFitNotification: null // Сбрасываем адресные уведомления
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

            // ===== СОЗДАНИЕ ЗАКАЗА =====
            createOrder: async (userOwner ) => {
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
                        owner: userOwner ,
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
                        services: orderServices,
                        text_status: formData.text_status,
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
                    
                    console.log('🔍 API response for createOrder:', createdOrder);
                    console.log('🔍 Order ID fields:', {
                        leadId: createdOrder.leadId,
                        _id: createdOrder._id,
                        order_id: createdOrder.order_id
                    });

                    toast.success(`Successfully created order ${createdOrder.leadId}`);
                    set(state => ({
                        currentOrder: createdOrder,
                        myOrders: [...state.myOrders, createdOrder],
                        isSaving: false
                    }));

                    // НЕ сбрасываем форму, если заказ создается для передачи в буфер
                    // get().resetForm();
                    return createdOrder;

                } catch (error) {
                    console.error('Create order error:', error);
                    set({ error: 'Failed to create order', isSaving: false });
                    return null;
                }
            },

            updateOrder: async (leadId: string | undefined) => {
                const { formData, selectedServices, validateForm, currentUser } = get();

                if (!leadId) {
                    set({ error: 'Lead ID is required for update' });
                    return null;
                }

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
                        changedBy: currentUser?.userAt || '',
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
                    toast.success('Successfully updated order');
                    return updatedOrder;

                } catch (error) {
                    console.error('Update order error:', error);
                    toast.error('Failed to update order');
                    set({
                        error: 'Failed to update order',
                        isSaving: false
                    });
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
                    if (!order) {
                        set({ isLoading: false });
                        return null;
                    }

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

            // ===== ЗАКАЗЫ С ПАГИНАЦИЕЙ =====
            fetchOrders: async (paginationParams?: PaginationParams, query?: OrderSearchQuery) => {
                set({ isLoading: true, error: null });

                try {
                    let { currentUser, currentPage, ordersPerPage } = get();

                    // Параметры пагинации с значениями по умолчанию
                    const page = paginationParams?.page ?? currentPage ?? 1;
                    const limit = paginationParams?.limit ?? ordersPerPage ?? 10;

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

                    // Формируем URL с параметрами пагинации
                    const url = new URL(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/myOrders/${encodeURIComponent(atClean)}`
                    );

                    // Добавляем параметры пагинации
                    url.searchParams.append('page', page.toString());
                    url.searchParams.append('limit', limit.toString());

                    // Добавляем дополнительные параметры поиска если есть
                    if (query?.owner) url.searchParams.append('owner', query.owner);
                    if (query?.transfer_status) url.searchParams.append('transfer_status', query.transfer_status);

                    console.log('Fetching orders with pagination:', { page, limit, query });

                    // Делаем запрос
                    const response = await fetch(url.toString());

                    // Проверяем статус ответа
                    if (!response.ok) {
                        if (response.status === 401) {
                            sessionStorage.removeItem("currentUser");
                            set({ currentUser: null });
                            throw new Error('Session expired. Please login again.');
                        }
                        throw new Error(`Failed to fetch orders: ${response.statusText}`);
                    }

                    // Парсим ответ
                    const data = await response.json() as FetchOrdersResponse;
                    console.log('Orders fetched successfully:', data);

                    // Сохраняем заказы и информацию о пагинации в стор
                    set({
                        orders: data.orders || [],
                        pagination: data.pagination || null,
                        currentPage: page,
                        ordersPerPage: limit,
                        isLoading: false,
                        error: null
                    });

                    return data; // Возвращаем данные для дополнительной обработки

                } catch (error) {
                    console.error('Fetch orders error:', error);

                    const errorMessage = error instanceof Error
                        ? error.message
                        : 'Failed to fetch orders. Please try again.';

                    set({
                        error: errorMessage,
                        isLoading: false,
                        orders: [],
                        pagination: null
                    });

                    if (errorMessage.includes('login') || errorMessage.includes('authenticated')) {
                        // Опционально: перенаправление на страницу логина
                        window.location.href = '/login';
                    }

                    throw error; // Пробрасываем ошибку для обработки в компонентах
                }
            },

            fetchMyOrders: async (owner) => {
                await get().fetchOrders(undefined, { owner, transfer_status: TransferStatus.ACTIVE });
                set(state => ({ myOrders: state.orders }));
            },

            // ===== МЕТОДЫ ПАГИНАЦИИ =====
            fetchNextPage: async () => {
                const { pagination, currentPage } = get();
                if (pagination?.hasNext) {
                    await get().fetchOrders({ page: currentPage + 1 });
                }
            },

            fetchPrevPage: async () => {
                const { pagination, currentPage } = get();
                if (pagination?.hasPrev) {
                    await get().fetchOrders({ page: currentPage - 1 });
                }
            },

            fetchPage: async (page: number) => {
                await get().fetchOrders({ page });
            },

            changePageSize: async (limit: number) => {
                await get().fetchOrders({ page: 1, limit }); // При изменении размера страницы идем на первую
            },

            // ===== ГЕТТЕРЫ ПАГИНАЦИИ =====
            getTotalPages: () => {
                const { pagination } = get();
                return pagination?.totalPages ?? 0;
            },

            getTotalOrders: () => {
                const { pagination } = get();
                return pagination?.totalOrders ?? 0;
            },

            hasNextPage: () => {
                const { pagination } = get();
                return pagination?.hasNext ?? false;
            },

            hasPrevPage: () => {
                const { pagination } = get();
                return pagination?.hasPrev ?? false;
            },

            // ===== ПРОВЕРКА ДУБЛЕЙ =====
            checkDoubleOrders: async (phoneNumber: string): Promise<Order[]> => {
                try {
                    if (!phoneNumber.trim() || phoneNumber.length < 8) {
                        return [];
                    }

                    const encodedPhone = encodeURIComponent(phoneNumber.trim());
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/doubleOrder?phone=${encodedPhone}`,
                        {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (!response.ok) {
                        console.error(`API error: ${response.status} ${response.statusText}`);
                        return [];
                    }

                    const data = await response.json();
                    console.log('🔍 [DEBUG] Full API response:', data);

                    // ✅ ИСПРАВЛЕНО: Проверяем правильные поля
                    if (data.duplicates && Array.isArray(data.orders)) {
                        console.log('✅ [DEBUG] Found duplicates:', data.orders);
                        return data.orders;
                    } else if (Array.isArray(data.orders)) {
                        // На случай если duplicates = false, но массив есть
                        console.log('ℹ️ [DEBUG] No duplicates flag, but orders array exists:', data.orders);
                        return data.orders;
                    } else {
                        console.warn('⚠️ [DEBUG] Unexpected API response format:', data);
                        return [];
                    }
                } catch (e) {
                    console.error('⚠ [DEBUG] Ошибка при поиске дублей заказов:', e);
                    return [];
                }
            },

            // ===== ФУНКЦИИ ПОИСКА =====
            searchOrders: async (query: string) => {
                const { currentUser } = get();

                if (!currentUser) {
                    set({ error: 'User not authenticated for search' });
                    return;
                }

                set({ isSearching: true, error: null });

                try {
                    const encodedQuery = encodeURIComponent(query.trim());
                    const at = currentUser.userAt.startsWith('@')
                        ? currentUser.userAt.slice(1)
                        : currentUser.userAt;

                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/search?q=${encodedQuery}&at=${encodeURIComponent(at)}`
                    );

                    if (!response.ok) {
                        throw new Error(`Search failed: ${response.statusText}`);
                    }

                    const data = await response.json();

                    if (data.success) {
                        set({
                            searchResults: {
                                allOrders: data.allOrders,
                                myOrders: data.myOrders,
                                notMyOrders: data.notMyOrders,
                                counts: data.counts,
                                searchType: data.searchType,
                                searchQuery: data.searchQuery,
                                searchedBy: data.searchedBy
                            },
                            isSearching: false,
                            error: null
                        });

                        console.log(`🔍 Search completed: Found ${data.counts.total} orders (${data.counts.my} mine, ${data.counts.notMy} others)`);
                    } else {
                        throw new Error(data.error || 'Search failed');
                    }

                } catch (error) {
                    console.error('Search error:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Search failed',
                        isSearching: false,
                        searchResults: null
                    });
                }
            },

            clearSearchResults: () => {
                set({
                    searchResults: null,
                    error: null
                });
            },

            viewNotMyOrder: async (orderId: string) => {
                const { currentUser } = get();

                if (!currentUser) {
                    console.warn('Cannot log view - user not authenticated');
                    return;
                }

                try {
                    const at = currentUser.userAt.startsWith('@')
                        ? currentUser.userAt.slice(1)
                        : currentUser.userAt;

                    // Логируем просмотр чужого заказа
                    await fetch(
                        'https://bot-crm-backend-756832582185.us-central1.run.app/api/orders/log-view',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: orderId,
                                viewedBy: at,
                                viewedAt: new Date().toISOString(),
                                action: 'view_not_my_order'
                            })
                        }
                    );

                    console.log(`🔍 Logged view of order ${orderId} by ${at}`);

                } catch (error) {
                    console.error('Failed to log order view:', error);
                    // Не показываем ошибку пользователю, это фоновое логирование
                }
            },

            // ===== ИЗМЕНЕНИЕ СТАТУСА =====
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
                    toast.success("Order status changed successfully");
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

            // ===== УТИЛИТЫ =====
            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),

            reset: () => {
                // 🆕 ОТКЛЮЧАЕМ WEBSOCKET при сбросе
                get().disconnectSocket();

                set({
                    currentOrder: null,
                    formData: initialFormData,
                    selectedServices: [],
                    orders: [],
                    teamBufferOrders: [],
                    myOrders: [],
                    currentTelegramOrder: null,
                    isWorkingOnTelegramOrder: false,
                    isLoading: false,
                    isSaving: false,
                    error: null,
                    pagination: null,
                    currentPage: 1,
                    ordersPerPage: 10,
                    socket: null,
                    isSocketConnected: false,
                    notifications: [],
                    searchResults: null,
                    isSearching: false,
                    // 🆕 Сбрасываем буфер
                    internalOrders: [],
                    externalOrders: [],
                    allBufferOrders: [],
                    bufferStats: {
                        totalCount: 0,
                        internalCount: 0,
                        externalCount: 0,
                        lastUpdated: null
                    },
                    isLoadingBuffer: false,
                    bufferError: null
                });
            }
        })),
        {
            name: 'order-store',
            version: 1,
        }
    )
);