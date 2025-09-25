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
import { getSessionStorageJSON, removeSessionStorage, setSessionStorageJSON } from "@/utils/storage"
import toast from "react-hot-toast"
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// === SOCKET CONFIG ===
const SOCKET_URL =
    (process.env.NEXT_PUBLIC_SOCKET_URL?.trim() || 'https://bot-crm-backend-756832582185.us-central1.run.app')
        .replace(/\/+$/, '');

if (!/^https?:\/\//i.test(SOCKET_URL)) {
    console.error('⚠ Некорректный NEXT_PUBLIC_SOCKET_URL:', SOCKET_URL);
}

const getShiftFromStorage = (): boolean => {
    try {
        const storedShift = sessionStorage.getItem('shift');
        return storedShift ? JSON.parse(storedShift) : false;
    } catch (error) {
        console.error('Ошибка при восстановлении shift из sessionStorage:', error);
        return false;
    }
};
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
    additionalTechName?: string;
    additionalTechSlots?: string[];
    dateSlots?: string[];
    description: string;
    teamId: string;
    custom?: number;
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
    formIdClaimedOrderInProcess: string | null;

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
        shift: boolean;
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
    noteOfClaimedOrder: NoteOfClaimedOrder[];
    
    // ===== ДЕЙСТВИЯ С ЗАКЛЕЙМЕННЫМИ ЗАКАЗАМИ =====
    clearClaimedOrders: () => void;
    removeClaimedOrder: (formId: string) => void;
    syncClaimedOrders: () => NoteOfClaimedOrder[];
    
                // ===== 🆕 АДРЕСНЫЕ УВЕДОМЛЕНИЯ =====
            addressFitNotification: {
                isVisible: boolean;
                message: string;
                nearestTeam: string;
                address: string;
                orderId?: string; // ID текущего заказа для передачи в буфер
                phoneNumber?: string; // Номер телефона для проверки возможности создания заказа
            } | null;

            // ===== 🆕 СОБЫТИЯ ДЛЯ НАВИГАЦИИ =====
            shouldRedirectToMyOrders: boolean;

                // ===== 🆕 WEBSOCKET ДЕЙСТВИЯ =====
            connectSocket: () => void;

            // ===== 🆕 АДРЕСНЫЕ УВЕДОМЛЕНИЯ =====
            showAddressFitNotification: (message: string, nearestTeam: string, address: string, orderId?: string, phoneNumber?: string) => void;
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

    // =====  НОВЫЕ МЕТОДЫ ДЛЯ БУФЕРА =====
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
    setCurrentUser: (user: { userId: string; userName: string; userAt: string; team: string; manager_id: string,shift: boolean }) => void;
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
    
    //Действия заказом claimed из телеграма 
    bindOrderToForm: (form_id:string,orderId: string) => Promise<boolean>;
    getNoteOfClaimedOrder: (form_id: string) => Promise<NoteOfClaimedOrder | undefined>;
    getClaimedOrders: () => Promise<NoteOfClaimedOrder[] | []>;
    // ===== ФУНКЦИИ ПОИСКА =====
    searchOrders: (query: string) => Promise<void>;
    clearSearchResults: () => void;
    viewNotMyOrder: (orderId: string) => Promise<void>;

    // ===== СМЕНА =====
    toggleShift: () => void;
}

// ===== КАСТОМНЫЕ ИНТЕРФЕЙСЫ =====
export interface NoteOfClaimedOrder {
    telephone: string;
    form_id: string;
    name: string;
    text: {
        size: string;
        mountType: string;
        surfaceType: string;
        wires: string;
        addons: string;
    };
    city: string;
    state: string;
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
    city: '',
    masterId: '',
    masterName: '',
    additionalTechName: '',
    additionalTechSlots: [],
    description: '',
    teamId: 'Init',
    custom: undefined
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
            formIdClaimedOrderInProcess: null,
            shouldRedirectToMyOrders: false,

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

            // =====  НОТЫ ЗАКАЗОВ =====
            noteOfClaimedOrder: (() => {
                try {
                    const stored = getSessionStorageJSON('noteOfClaimedOrder', []);
                    console.log('🔍 Store init - Loaded from sessionStorage:', stored);
                    
                    // Если это одиночный объект, преобразуем в массив
                    if (stored && !Array.isArray(stored)) {
                        console.log('🔍 Store init - Converting single object to array');
                        return [stored];
                    }
                    
                    return stored || [];
                } catch (error) {
                    console.error('🔍 Store init - Error parsing sessionStorage:', error);
                    return [];
                }
            })(),

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



            // ===== 🆕 WEBSOCKET ДЕЙСТВИЯ =====
            connectSocket: async () => {
                const { currentUser, socket: existingSocket } = get();
                
                // Глобальная блокировка - если уже есть активное соединение, не создаем новое
                if ((window as any).__activeSocketConnection) {
                    console.log('⚠ Глобально блокируем создание нового WebSocket соединения');
                    return;
                }

                if (get().isSocketConnected) {
                    console.log('⚠ Уже подключен или идет подключение');
                    return;
                }
            
                if (!currentUser?.userId || !currentUser?.team || !currentUser?.userName) {
                    console.log('⚠ Нет данных пользователя для WebSocket');
                    return;
                }

                if (existingSocket?.connected) {
                    console.log('⚡ WebSocket уже подключен');
                    return;
                }

                // Устанавливаем глобальный флаг
                (window as any).__activeSocketConnection = true;
                console.log(' Устанавливаем глобальную блокировку WebSocket');

                // Проверяем доступность сервера перед подключением
                try {
                    const serverCheck = await fetch(`${SOCKET_URL}/health`, {
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-cache'
                    });
                    
                    if (!serverCheck.ok) {
                        throw new Error(`Сервер недоступен: ${serverCheck.status}`);
                    }
                    
                    console.log('✅ Сервер доступен, подключаемся к WebSocket');
                } catch (error) {
                    console.error('❌ Сервер недоступен:', error);
                    toast.error('Сервер временно недоступен. Попробуйте позже.');
                    (window as any).__activeSocketConnection = false; // Сбрасываем флаг
                    return;
                }

                // Закрываем предыдущее соединение если есть
                if (existingSocket) {
                    existingSocket.disconnect();
                }

                console.log(`🔌 Подключаемся как ${currentUser.userName} к команде ${currentUser.team}`);

                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const io = require('socket.io-client');
                console.log('🔗 SOCKET_URL =', SOCKET_URL);

                const socket = io(SOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    path: '/socket.io',
                    reconnection: true,
                    reconnectionAttempts: 5,        // Уменьшаем с 20 до 5
                    reconnectionDelay: 5000,        // 5 секунд вместо 2
                    reconnectionDelayMax: 60000,    // 1 минута вместо 30 секундсекунд
                    timeout: 60000,                 // Увеличиваем с 30 до 60 секунд
                    forceNew: false,
                    upgrade: true,
                    rememberUpgrade: true,
                    autoConnect: true,
                    query: {
                        client: 'web',
                        version: '1.0.0'
                    }
                });

                // Обработчики событий
                socket.on('connect', () => {
                    console.log('✅ WebSocket подключен!', socket.id);
                    console.log(' Connection details:', {
                        url: SOCKET_URL,
                        transport: socket.io.engine.transport.name,
                        readyState: socket.readyState,
                        connected: socket.connected,
                        disconnected: socket.disconnected
                    });
                    console.log('👤 Current user data:', {
                        userId: currentUser.userId,
                        userName: currentUser.userName,
                        userAt: currentUser.userAt,
                        team: currentUser.team,
                        manager_id: currentUser.manager_id
                    });
                    set({ isSocketConnected: true });

                    socket.emit('join-team', {
                        team: currentUser.team,
                        username: currentUser.userName,
                        at: currentUser.userAt
                    });

                    // Регистрируем менеджера для таргетных уведомлений
                    console.log(' Регистрируем менеджера для таргетных уведомлений:', {
                        manager_id: currentUser.manager_id,
                        at: currentUser.userAt,
                        user_id: currentUser.userId,
                        socket_id: socket.id
                    });
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

                // Добавляем обработчик connect_error
                socket.on('connect_error', (error: any) => {
                    console.error('❌ Ошибка подключения WebSocket:', {
                        message: error.message,
                        description: error.description,
                        context: error.context,
                        type: error.type,
                        url: SOCKET_URL
                    });
                    
                    // Показываем пользователю информацию об ошибке
                    toast.error(`Ошибка подключения: ${error.message || 'Не удалось подключиться к серверу'}`);
                    
                    set({ isSocketConnected: false });
                    (window as any).__activeSocketConnection = false; // Сбрасываем флаг
                });

                // Добавляем обработчик reconnect
                socket.on('reconnect', (attemptNumber: number) => {
                    console.log(`🔄 WebSocket переподключен после ${attemptNumber} попыток`);
                    toast.success('Соединение восстановлено');
                    set({ isSocketConnected: true });
                });

                // Добавляем обработчик reconnect_attempt
                socket.on('reconnect_attempt', (attemptNumber: number) => {
                    console.log(` Попытка переподключения #${attemptNumber}`);
                });

                // Добавляем обработчик reconnect_error
                socket.on('reconnect_error', (error: any) => {
                    console.error('❌ Ошибка переподключения:', error);
                });

                // Добавляем обработчик reconnect_failed
                socket.on('reconnect_failed', () => {
                    console.error('❌ Не удалось переподключиться после всех попыток');
                    toast.error('Не удалось восстановить соединение. Проверьте интернет и попробуйте обновить страницу.');
                    set({ isSocketConnected: false });
                    (window as any).__activeSocketConnection = false; // Сбрасываем флаг
                });

                socket.on('team-joined', (data: any) => {
                    console.log('🎉 Присоединились к команде:', data);
                });

                // 🎯 Таргетные уведомления для конкретного менеджера
                socket.on('target-notification', async(data: any) => {
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
                        const noteData = await get().getClaimedOrders();
                        console.log('🔍 noteData:', noteData);
                    

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

                // Добавляем переменную для отслеживания последнего события
                let lastOrderEvent: string | null = null;
                let orderEventTimeout: NodeJS.Timeout | null = null;

                socket.on('new-order-in-buffer', (data: any) => {
                    // Логируем ВСЕ входящие события
                    console.log('🔍 ВХОДЯЩЕЕ СОБЫТИЕ new-order-in-buffer:', {
                        order_id: data.order_id,
                        socket_id: socket.id,
                        timestamp: new Date().toISOString(),
                        window_flag: (window as any).__processingOrderEvent,
                        local_flag: lastOrderEvent
                    });

                    // Глобальная проверка - если событие уже обрабатывается, пропускаем
                    if ((window as any).__processingOrderEvent === data.order_id) {
                        console.log('⚠ Глобально блокируем дублирующее событие:', data.order_id);
                        return;
                    }

                    // Проверяем, не обрабатывали ли мы уже это событие локально
                    if (lastOrderEvent === data.order_id) {
                        console.log('⚠ Локально блокируем дублирующее событие:', data.order_id);
                        return;
                    }

                    // Устанавливаем глобальный флаг
                    (window as any).__processingOrderEvent = data.order_id;
                    
                    // Сразу запоминаем событие локально
                    lastOrderEvent = data.order_id;

                    // Очищаем предыдущий таймаут если есть
                    if (orderEventTimeout) {
                        clearTimeout(orderEventTimeout);
                    }

                    // Устанавливаем задержку в 500мс
                    orderEventTimeout = setTimeout(() => {
                        console.log('🔔 Обрабатываем событие new-order-in-buffer после задержки:', data);
                        
                        toast.success(' НОВЫЙ ЗАКАЗ В БУФЕРЕ!');
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

                        // Очищаем глобальный флаг через некоторое время
                        setTimeout(() => {
                            (window as any).__processingOrderEvent = null;
                        }, 1000);
                    }, 500);
                });

                socket.on('error', (error: any) => {
                    console.error('WebSocket ошибка:', error);
                });

                // 🔄 Добавляем heartbeat для поддержания соединения
           // 🔄 Улучшенный heartbeat для поддержания соединения
            const heartbeatInterval = setInterval(() => {
                if (socket.connected) {
                    socket.emit('keep-alive');
                    console.log(' Keep-alive sent to server');
                } else {
                    console.log('⚠ Socket не подключен, пропускаем heartbeat');
                }
          }, 120000); 
                // Обработчик keep-alive-ack от сервера
                            socket.on('keep-alive-ack', () => {
                                console.log('💓 Keep-alive acknowledged by server');
                            });
            // Увеличиваем таймаут для heartbeat
            const heartbeatTimeout = setTimeout(() => {
                if (socket.connected) {
                    console.log('⚠ Keep-alive timeout, проверяем соединение');
                    socket.emit('ping');
                }
            }, 30000); // Увеличиваем с 10 до 30 секунд

         

                // Добавляем обработчик keep-alive timeout
             

                // Обработчик pong от сервера
                socket.on('pong', () => {
                    console.log(' Pong received from server');
                    clearTimeout(heartbeatTimeout);
                });

                        socket.on('disconnect', (reason: string) => {
                clearInterval(heartbeatInterval);
                clearTimeout(heartbeatTimeout);
                console.log('⚠ WebSocket отключен, причина:', reason);
                set({ isSocketConnected: false });
                (window as any).__activeSocketConnection = false; // Сбрасываем флаг
                
                // Более информативные сообщения
                if (reason === 'io server disconnect') {
                    toast.error('Сервер разорвал соединение');
                } else if (reason === 'io client disconnect') {
                    console.log('Клиент разорвал соединение');
                } else if (reason === 'transport close') {
                    toast.error('Соединение потеряно. Попытка переподключения...');
                } else if (reason === 'ping timeout') {
                    toast.error('Таймаут соединения. Попытка переподключения...');
                } else if (reason === 'server namespace disconnect') {
                    toast.error('Соединение заменено новым');
                }
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
            getClaimedOrders: async () => {
                const { currentUser } = get();
                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return [];
                }
                const response = await fetch('https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getClaimedOrders',{
                    method:"POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        at: currentUser.userAt
                    })
                });
                const data = await response.json();
                
                if (!data.success || !data.forms) {
                    return [];
                }
                
                // Преобразуем данные в формат NoteOfClaimedOrder
                const claimedOrders: NoteOfClaimedOrder[] = data.forms.map((form: any) => ({
                    telephone: form.telephone,
                    form_id: form._id,
                    name: form.client_name,
                    text: {
                        size: form.text.size || '',
                        mountType: form.text.mountType || '',
                        surfaceType: form.text.surfaceType || '',
                        wires: form.text.wires || '',
                        addons: form.text.addons || ''
                    },
                    city: form.text.city || '',
                    state: form.text.state || ''
                }));
                set({noteOfClaimedOrder: claimedOrders});
                return claimedOrders;
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

            //метод привязки заказа после claim к форме после создания 
            bindOrderToForm: async (form_id:string,orderId: string) => {
                const { currentUser } = get();
                if (!currentUser) {
                    set({ bufferError: 'Пользователь не авторизован' });
                    return false;
                }
                try {
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/order-form/bind/${form_id}/${orderId}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                    if (!response.ok) {
                        throw new Error('Не удалось привязать заказ к форме');
                        toast.error('Unsuccess bind order to form, try again');
                    }
                    const result = await response.json();
                    toast.success('Order successfully bound to telegram form');
                    return true;
                }
                catch (error) {
                    console.error('Ошибка при привязке заказа к форме:', error);
                    toast.error('Не удалось привязать заказ к форме');
                    return false;
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
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Не удалось забрать заказ');
                    }

                    // Обновляем буфер после успешного клейма
                    await get().refreshBuffer();
                    toast.success('Заказ успешно забран!');
                    return true;

                } catch (error) {
                    console.error('Ошибка при заборе заказа:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Не удалось забрать заказ';
                    toast.error(errorMessage);
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
            // Очистка заклейменных заказов
            clearClaimedOrders: () => {
                console.log('🧹 Clearing claimed orders');
                set({ noteOfClaimedOrder: [] });
                removeSessionStorage('noteOfClaimedOrder');
            },

            // Удаление конкретного заклейменного заказа
            removeClaimedOrder: (formId: string) => {
                console.log('🧹 Removing specific claimed order:', formId);
                const currentClaimedOrders = get().noteOfClaimedOrder;
                const updatedClaimedOrders = currentClaimedOrders.filter(
                    order => order.form_id !== formId
                );
                
                set({ noteOfClaimedOrder: updatedClaimedOrders });
                setSessionStorageJSON('noteOfClaimedOrder', updatedClaimedOrders);
                
                console.log('✅ Removed claimed order from notes');
            },

            // Синхронизация store с sessionStorage
            syncClaimedOrders: () => {
                try {
                    const stored = getSessionStorageJSON('noteOfClaimedOrder', []);
                    if (stored && stored.length > 0) {
                        let ordersArray: NoteOfClaimedOrder[] = [];
                        
                        if (Array.isArray(stored)) {
                            ordersArray = stored;
                        } else if (stored) {
                            ordersArray = [stored];
                        }
                        
                        console.log('🔄 Syncing store with sessionStorage:', ordersArray);
                        set({ noteOfClaimedOrder: ordersArray });
                        return ordersArray;
                    }
                    return []
                } catch (error) {
                    console.error('Error syncing claimed orders:', error);
                    return [];
                }
            },
            toggleShift: async () => {
                const currentShift = get().currentUser?.shift;

                const at = get().currentUser?.userAt;
                
                const endpoint = currentShift 
                    ? 'https://bot-crm-backend-756832582185.us-central1.run.app/api/user/turn-off-shift'
                    : 'https://bot-crm-backend-756832582185.us-central1.run.app/api/user/turn-on-shift';
                
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ at: at })
                });
                
                if (!res.ok) {
                    throw new Error('Failed to toggle shift');
                }
                
                const result = await res.json();
                console.log('✅ Shift toggled:', result);
                
                // Обновляем состояние и sessionStorage
                const newShiftState = !currentShift;
                setSessionStorageJSON('shift', newShiftState);
                return result;
            },
            // Получение заклейменных заказов
            getNoteOfClaimedOrder: async (form_id: string): Promise<NoteOfClaimedOrder | undefined> => {
                try {
                    console.log('🔍 Fetching form data for form_id:', form_id);
                    
                    const response = await fetch(
                        `https://bot-crm-backend-756832582185.us-central1.run.app/api/order-form/get/${form_id}`,
                        {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                        }
                    );
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch form notes');
                    }
                    
                    const data = await response.json();
                    console.log('📡 Raw API response:', data); // ← ДОБАВЬТЕ ЭТО
                    
                    // Преобразуем данные API в нужный формат
                    const noteData: NoteOfClaimedOrder = {
                        telephone: data.form?.telephone || '',      
                        name: data.form?.client_name || '',  
                        form_id: data.form?._id || '',         
                        text: {        
                            size: data.form?.text?.size || '',         
                            mountType: data.form?.text?.['mountType'] || '', 
                            surfaceType: data.form?.text?.['surfaceType'] || '', 
                            wires: data.form?.text?.['wires'] || '',     
                            addons: data.form?.text?.['addons'] || ''    
                        },
                        city: data.form?.city || '',                    
                        state: data.form?.state || ''                  
                    };
                    
                    console.log('✅ Transformed noteData:', noteData); // ← И ЭТО
                    //TODO: реализовать кастомный буффер каждому менеджеру по текущим не обработаннным заказам
                    
                    // Получаем текущие заказы из sessionStorage
                    const currentOrders = getSessionStorageJSON('noteOfClaimedOrder', []);
                    let ordersArray: NoteOfClaimedOrder[] = [];
                    
                    if (currentOrders && currentOrders.length > 0) {
                        ordersArray = Array.isArray(currentOrders) ? currentOrders : [currentOrders];
                    }
                    
                    // Добавляем новый заказ в массив
                    ordersArray.push(noteData);
                    
                    // Сохраняем обновленный массив
                    setSessionStorageJSON('noteOfClaimedOrder', ordersArray);
                    console.log('💾 Saved updated orders array to sessionStorage:', ordersArray);
                    
                    return noteData;
                } catch (error) {
                    console.error('Error fetching form notes:', error);
                    return undefined;
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
                
                console.log('⏳ Waiting 5 seconds before API call...');
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Delay completed, making API call...');
                
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
                    
                    if (!data.fit) {
                        const message = `Address doesn't match your team. Recommended to transfer order to team ${data.nearest_team}`;
                
                        const currentOrderId = get().currentOrder?._id || get().currentLeadID;
                        const currentPhoneNumber = get().formData.phoneNumber;
                        get().showAddressFitNotification(message, data.nearest_team, address, currentOrderId, currentPhoneNumber);
                    } else {
                        let cityToUse = '';
                        let shouldShowManualSelection = false;
                        console.log('🔍 Processing suitable address - Address data received:', {
                            city: data.address_data.data.city,
                            state: data.address_data.data.state,
                            postcode: data.address_data.data.postcode
                        });
                        if (data.address_data.data.city) {
                            const detectedCity = data.address_data.data.city;
                            console.log('🔍 Checking if detected city is available for team:', detectedCity);
                            
                            try {
                                console.log(`🔍 Fetching available cities for team: ${user.team}`);
                                const citiesResponse = await fetch(
                                    `https://bot-crm-backend-756832582185.us-central1.run.app/api/user/getCitiesByTeam?team=${user.team}`
                                );
                                
                                if (citiesResponse.ok) {
                                    const citiesData = await citiesResponse.json();
                                    const availableCities = citiesData.cities || [];
                                    
                                    console.log('🏙️ Available cities for team:', availableCities.map((c: any) => c.name));
                                    
                                    // Проверяем, есть ли обнаруженный город в списке доступных
                                    const cityIsAvailable = availableCities.some((city: any) => {
                                        const cityName = city.name?.toLowerCase();
                                        const detectedCityLower = detectedCity.toLowerCase();
                                        return cityName === detectedCityLower;
                                    });
                                    
                                    if (cityIsAvailable) {
                                        cityToUse = detectedCity;
                                        console.log('✅ Detected city is available, using:', cityToUse);
                                    } else if (data.address_data.data.state) {
                                        cityToUse = data.address_data.data.state;
                                        console.log('❌ Detected city not available, using state instead:', cityToUse);
                                    } else {
                                        console.log('❌ No suitable city found');
                                    }
                                } else {
                                    console.log('❌ Failed to fetch available cities, using detected city:', detectedCity);
                                    cityToUse = detectedCity;
                                }
                            } catch (error) {
                                console.error('❌ Error fetching available cities, using detected city:', detectedCity);
                                cityToUse = detectedCity;
                            }
                        } 
                        // Если города нет, но есть штат - используем штат как город
                        else if (data.address_data.data.state) {
                            const stateName = data.address_data.data.state;
                            cityToUse = stateName;
                            console.log('✅ Using state as city:', cityToUse);
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
                    // 🆕 ЗАГРУЖАЕМ claimed orders
                    get().getClaimedOrders();
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
                    setSessionStorageJSON('currentUser', data.user);

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
                const user = getSessionStorageJSON('currentUser', null);
                if (user) {
                    set({ currentUser: user });

                    // 🆕 АВТОПОДКЛЮЧЕНИЕ WEBSOCKET при инициализации
                    setTimeout(() => {
                        get().connectSocket();
                        get().fetchBufferOrders();
                        // 🆕 ЗАГРУЖАЕМ claimed orders при инициализации
                        get().getClaimedOrders();
                    }, 100);
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
                    error: null,
                    addressFitNotification: null // Сбрасываем адресные уведомления
                }, false, 'resetForm');
            },

            validateForm: () => {
                const { formData, selectedServices } = get();
                const errors: string[] = [];

                if (!formData.phoneNumber.trim()) errors.push('Phone number is required');
                
                // Проверяем, что если выбрана дата, то мастер обязателен
                if (formData.date && !formData.masterName.trim()) {
                    errors.push('Master is required when date is selected');
                }
                
                selectedServices.forEach(service => {
                    if (service.category === 'main' && service.name !== 'NO TV' && service.value !== 'noTV') {
                        if (!service.diagonals || service.diagonals.length === 0) {
                            errors.push(`TV diagonals are required for ${service.name}`);
                        }
                    }
                    if (service.category === 'main' && (service.name === 'NO TV' || service.name === 'Custom' || service.value === 'noTV' || service.value === 'custom')) {
                        if (!service.customPrice) {
                            errors.push(`Custom price is required for ${service.name} service`);
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
            
                // Иначе считаем обычную цену
                return selectedServices.reduce((total, service) => {
                    const servicePrice = (service.name === "NO TV" || service.name === "Custom" || service.value === "noTV" || service.value === "custom") && service.customPrice !== undefined
                        ? service.customPrice
                        : service.price;
                    const serviceTotal = servicePrice * (service.quantity || 1);

                    const subItemsTotal = service.subItems ?
                        service.subItems.reduce((subSum: number, subItem: ServiceItem) => {
                            const subItemPrice = (subItem.name === "NO TV" || subItem.name === "Custom" || subItem.value === "noTV" || subItem.value === "custom") && subItem.customPrice !== undefined
                                ? subItem.customPrice
                                : subItem.price;
                            return (subSum + (subItemPrice * (subItem.quantity || 1))) * (service.quantity || 1);
                        }, 0
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
                const currentUser = get().currentUser;
                set({ isSaving: true, error: null });

                try {
                    const orderServices: OrderService[] = selectedServices.map(service =>
                        convertServiceItemToOrderService(service, ['mount'])
                    );

                    const orderData: CreateOrderData = {
                        dateSlots: formData.dateSlots,
                        owner: userOwner ,
                        team: formData.teamId,
                        leadName: formData.customerName,
                        phone: formData.phoneNumber,
                        address: formData.address,
                        zip_code: formData.zipCode,
                        city: formData.city,
                        date: formData.date,
                        time: formData.time,
                        custom: formData.custom,
                        master: formData.masterName,
                        additionalTechName: formData.additionalTechName,
                        additionalTechSlots : formData.additionalTechSlots,
                        manager_id: currentUser?.manager_id,
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
                    console.log(`❌❌❌❌${orderData}`);

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

                    // 🔗 Привязываем заказ к форме если есть formIdClaimedOrderInProcess
                    const { formIdClaimedOrderInProcess } = get();
                    console.log('🔍 createOrder - formIdClaimedOrderInProcess:', formIdClaimedOrderInProcess);
                    console.log('🔍 createOrder - typeof formIdClaimedOrderInProcess:', typeof formIdClaimedOrderInProcess);
                    
                    if (formIdClaimedOrderInProcess) {
                        console.log('🔗 Binding order to telegram form:', formIdClaimedOrderInProcess);
                        
                        try {
                            // Привязываем заказ к форме
                            const bindResult = await get().bindOrderToForm(formIdClaimedOrderInProcess, createdOrder.leadId);
                            
                            if (bindResult) {
                                console.log('✅ Order successfully bound to telegram form');
                                toast.success('Order bound to telegram form');
                                
                                // Удаляем заказ из claimed notes
                                get().removeClaimedOrder(formIdClaimedOrderInProcess);
                                
                                // Очищаем флаг
                                set({ formIdClaimedOrderInProcess: null });
                                
                                console.log('🧹 Removed claimed order from notes');
                            } else {
                                console.error('❌ Failed to bind order to telegram form');
                                toast.error('Failed to bind order to telegram form');
                            }
                        } catch (error) {
                            console.error('❌ Error binding order to telegram form:', error);
                            toast.error('Error binding order to telegram form');
                        }
                    }

                    toast.success(`Successfully created order ${createdOrder.leadId}`);
                    set(state => ({
                        currentOrder: createdOrder,
                        myOrders: [...state.myOrders, createdOrder],
                        isSaving: false
                    }));

                    // 🔄 Автоматический ресет формы и переход на myOrders через 3 секунды
                    setTimeout(() => {
                        console.log('🔄 Auto-resetting form and redirecting to myOrders');
                        
                        // Сбрасываем форму
                        get().resetForm();
                        
                        // Очищаем claimed order флаг если был
                        if (get().formIdClaimedOrderInProcess) {
                            set({ formIdClaimedOrderInProcess: null });
                        }
                        
                
                        
                        // Устанавливаем флаг для перехода
                        set({ shouldRedirectToMyOrders: true });
                        
                    }, 1000); // 3 секунды задержки

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
                        additionalTechName: formData.additionalTechName,
                        dateSlots: formData.dateSlots,
                        additionalTechSlots: formData.additionalTechSlots,
                        comment: formData.description,
                        team: formData.teamId,
                        custom: formData.custom,
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
                    console.log('order', order);

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
                        const storageUser = getSessionStorageJSON("currentUser", null);
                        if (storageUser) {
                            try {
                                currentUser = storageUser;
                                set({ currentUser });
                            } catch (parseError) {
                                console.error('Invalid user data in sessionStorage:', parseError);
                                removeSessionStorage("currentUser");
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
                    if (query?.text_status) url.searchParams.append('text_status', query.text_status);

                    console.log('Fetching orders with pagination:', { page, limit, query });

                    // Делаем запрос
                    const response = await fetch(url.toString());

                    // Проверяем статус ответа
                    if (!response.ok) {
                        if (response.status === 401) {
                            removeSessionStorage("currentUser");
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
                    console.log(at,orderId);
        
                    // Логируем просмотр чужого заказа
                    await fetch(
                        'https://bot-crm-backend-756832582185.us-central1.run.app/api/user/countNotOwn',
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                order_id: orderId,
                                at: at,
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

                //  НЕ СБРАСЫВАЕМ noteOfClaimedOrder при reset
                const currentClaimedOrders = get().noteOfClaimedOrder;

                set({
                    currentOrder: null,
                    formData: initialFormData,
                    selectedServices: [],
                    orders: [],
                    teamBufferOrders: [],
                    myOrders: [],
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
                    bufferError: null,
                    // 🆕 СОХРАНЯЕМ noteOfClaimedOrder
                    noteOfClaimedOrder: currentClaimedOrders
                });
            }
        })),
        {
            name: 'order-store',
            version: 1,
        }
    )
);
