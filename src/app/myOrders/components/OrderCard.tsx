import React, { useMemo, useState } from 'react'
import {useOrderStore} from "@/stores/orderStore";
import Order from "@/types/formDataType";
import {useRouter} from "next/navigation";
import ClientInfoModal from "@/app/myOrders/components/ClientInfoModal";
import { OrderStatus } from "@/types/api"; // Импортируем общий enum

// Типы документа из Mongo (без жёстких зависимостей)
export type MongoDate = string | { $date: string }
export type MongoId   = string | { $oid: string }

import {
    Calendar,
    User,
    MapPin,
    Package,
    DollarSign,
    Eye,
    Edit,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Search,
    Plus,
    FileText
} from 'lucide-react';

export type OrderDoc = {
    _id?: MongoId
    owner?: string
    order_id: string
    address?: string
    client_id?: number | string
    zip_code?: string
    team?: string
    date?: string
    manager_id?: string
    miles?: any[]
    response_time?: any[]
    text_status?: string
    visits?: any[]
    canceled?: boolean
    transfer_status?: 'active' | 'buffer' | 'transferred' | string
    transfer_history?: any[]
    leadName?: string
    phone?: string
    city?: string
    master?: string
    comment?: string
    total?: number
    services?: Array<{
        label: string
        diagonal?: string
        count?: number
        workType?: string[]
        price?: number
        materialPrice?: number
        addonsPrice?: number
        addons?: Array<{ label: string; value: string; price?: number; count?: number; _id?: MongoId }>
        materials?: Array<{ label: string; value: string; price?: number; count?: number; _id?: MongoId }>
        _id?: MongoId
    }>
    original?: any
    changes?: any[]
    createdAt?: MongoDate
    __v?: number
}

// Утилиты
function readOid(v?: MongoId) {
    if (!v) return undefined
    return typeof v === 'string' ? v : v.$oid
}

function readDate(v?: MongoDate): Date | undefined {
    if (!v) return undefined
    if (typeof v === 'string') {
        const s = v.trim()
        if (!s) return undefined
        const d = new Date(s)
        return isNaN(+d) ? undefined : d
    }
    const d = new Date(v.$date)
    return isNaN(+d) ? undefined : d
}

function formatDateTime(d?: Date) {
    if (!d) return ''
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' в ' + d.toLocaleTimeString('ru-RU', { hour: 'numeric', minute: '2-digit' })
}

// УНИФИЦИРОВАННЫЕ ЦВЕТА И ЛЕЙБЛЫ (как в StatusPills)
const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
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
    [OrderStatus.ORDER_STATUS]: { bg: '#e0e0e0', text: '#000000' },
}

const statusLabel: Record<OrderStatus, string> = {
    [OrderStatus.CANCELLED]: 'Отменен',
    [OrderStatus.OTHER_REGION]: 'Другая область',
    [OrderStatus.INVALID]: 'Невалидный',
    [OrderStatus.NO_ANSWER]: 'Нет ответа',
    [OrderStatus.IN_WORK]: 'В работе',
    [OrderStatus.NIGHT]: 'Ночной',
    [OrderStatus.NIGHT_EARLY]: 'Ночной ранний',
    [OrderStatus.NEED_CONFIRMATION]: 'Нужно подтверждение',
    [OrderStatus.NEED_APPROVAL]: 'Нужно согласование',
    [OrderStatus.COMPLETED]: 'Завершен',
    [OrderStatus.CALL_TOMORROW]: 'Перезвон завтра',
    [OrderStatus.ORDER_STATUS]: 'Оформлен',
}

// Маппинг русских статусов в enum
const ruToEnum: Record<string, OrderStatus> = {
    'Отменен': OrderStatus.CANCELLED,
    'Другая область': OrderStatus.OTHER_REGION,
    'Другой регион': OrderStatus.OTHER_REGION, // альтернативное название
    'Невалидный': OrderStatus.INVALID,
    'Нет ответа': OrderStatus.NO_ANSWER,
    'В работе': OrderStatus.IN_WORK,
    'Ночной': OrderStatus.NIGHT,
    'Ночной ранний': OrderStatus.NIGHT_EARLY,
    'Нужно подтверждение': OrderStatus.NEED_CONFIRMATION,
    'Нужно согласование': OrderStatus.NEED_APPROVAL,
    'Завершен': OrderStatus.COMPLETED,
    'Перезвон завтра': OrderStatus.CALL_TOMORROW,
    'Оформлен': OrderStatus.ORDER_STATUS,
}

export type OrderCardProps = {
    order: Order
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onChangeStatus?: (id: string, st: string) => void
}

export default function OrderCardPretty({ order, onView, onEdit, onChangeStatus }: OrderCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const changeStatus = useOrderStore(state => state.changeStatus)

    const availableStatuses: OrderStatus[] = [
        OrderStatus.IN_WORK,
        OrderStatus.NEED_CONFIRMATION,
        OrderStatus.NEED_APPROVAL,
        OrderStatus.CALL_TOMORROW,
        OrderStatus.NIGHT,
        OrderStatus.NIGHT_EARLY,
        OrderStatus.OTHER_REGION,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
        OrderStatus.INVALID,
        OrderStatus.ORDER_STATUS
    ]

    const handleChangeStatus = (st: OrderStatus) => {
        const ru = statusLabel[st];
        const leadId = order.order_id;
        changeStatus(ru, leadId);
    }

    function currency(n?: number, sym: string = '$') {
        const v = typeof n === 'number' ? n : 0
        return sym + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
    }

    const updateOrder = useOrderStore(state => state.getByLeadID);
    const router = useRouter();

    const handleUpdateOrder = async (leadId: string) => {
        console.log(leadId)
        const order = await updateOrder(leadId);

        if (order) {
            console.log("Заказ найден:", order);
            router.push("/changeOrder")
        } else {
            console.warn("Заказ не найден");
        }
    }

    const oid = readOid(order._id) || order.order_id
    const [clientModalOpen, setClientModalOpen] = useState(false)

    // Текущий статус: из order.text_status (RU) → enum
    const currentStatus: OrderStatus = ruToEnum[order.text_status || 'Оформлен'] || OrderStatus.ORDER_STATUS

    // Резюме услуг
    const mainLabel = order.services?.[0]?.label
    const extras = (order.services?.[0]?.addons?.length || 0) + (order.services?.[0]?.materials?.length || 0)
    const servicesSummary = mainLabel ? `${mainLabel}${extras ? ` +${extras} доп.` : ''}` : '—'

    // Теги услуг/материалов
    const serviceChips = [
        ...(order.services?.map(s => s.label) || [])
    ]
    const materialChips = [
        ...(order.services?.flatMap(s => (s.materials || []).map(m => m.label)) || [])
    ]

    const desc = order.comment || ''
    const short = desc.length > 120 && !expanded ? desc.slice(0, 120) + '…' : desc

    // Закрытие дропдауна по клику вне
    React.useEffect(() => {
        function onDoc(e: MouseEvent) {
            const target = e.target as HTMLElement
            if (!target.closest?.('[data-status-root]')) setStatusOpen(false)
        }
        if (statusOpen) document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [statusOpen])

    // Время для отображения
    const displayDateTime = useMemo(() => {
        if (order.time && /am|pm/i.test(order.time)) {
            return `${order.date || ''} ${order.time}`.trim();
        }

        if (order.date && /am|pm/i.test(order.date)) {
            return order.date;
        }

        const d = (order.date && order.date.trim())
            ? readDate(order.date)
            : readDate(order.date);
        return d ? formatDateTime(d) : '';
    }, [order.date, order.time, order.createdAt]);

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 relative" data-status-root>
                {/* Заголовок */}
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">ID:{order.order_id}</h3>
                    {/* Статус как кнопка с дропдауном */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setStatusOpen(v => !v)}
                            className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
                            style={{
                                backgroundColor: statusColors[currentStatus].bg,
                                color: statusColors[currentStatus].text,
                                borderColor: 'rgba(0,0,0,.08)'
                            }}
                            aria-haspopup="listbox"
                            aria-expanded={statusOpen}
                        >
                            {statusLabel[currentStatus]}
                        </button>
                        {statusOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-80 overflow-auto" role="listbox">
                                {availableStatuses.map((st) => (
                                    <button
                                        key={st}
                                        role="option"
                                        aria-selected={st === currentStatus}
                                        onClick={() => {
                                            setStatusOpen(false);
                                            handleChangeStatus(st);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${st===currentStatus ? 'bg-gray-50' : ''}`}
                                    >
                                    <span
                                        className="inline-block w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: statusColors[st].bg,
                                            outline: '1px solid rgba(0,0,0,.06)'
                                        }}
                                    />
                                        <span className="flex-1">{statusLabel[st]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Клиент */}
                <div className="mt-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {order.leadName || 'Без имени'} <span className="text-sm"></span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Client ID: #{String(order.client_id ?? '').toString().padStart(5, '0')}
                        </div>
                    </div>
                </div>

                {/* Адрес и дата */}
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-600" />
                        <span>{order.address}{order.zip_code ? `, ${order.zip_code}` : ''}</span>
                    </div>
                    {displayDateTime && (
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-600" />
                            <span>{displayDateTime}</span>
                        </div>
                    )}
                </div>

                {/* Услуги */}
                <div className="mt-4">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <Package size={16} className="text-gray-800" />
                        <span>Услуги:</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{servicesSummary}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {serviceChips.map((c, i) => (
                            <span key={`svc-${i}`} className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 border border-red-200">{c}</span>
                        ))}
                        {materialChips.map((c, i) => (
                            <span key={`mat-${i}`} className="px-3 py-1 rounded-full text-sm bg-rose-50 text-rose-700 border border-rose-200">{c}</span>
                        ))}
                    </div>
                </div>

                {/* Описание */}
                {(desc && desc.trim()) && (
                    <div className="mt-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileText size={16} className="text-gray-800" />
                            <span>Описание:</span>
                        </div>
                        <div className="mt-1 bg-blue-50 text-gray-800 rounded-xl px-3 py-2 text-sm">
                            {short}
                            {desc.length > 120 && (
                                <button className="ml-2 text-blue-600 underline" onClick={() => setExpanded(v => !v)}>
                                    {expanded ? 'Скрыть' : 'Показать все'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Итог */}
                <div className="mt-5 flex items-center justify-between">
                    <div className="text-2xl font-bold flex items-center gap-2">
                        <span>{currency(order.total)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            title="Просмотр клиента"
                            onClick={() => setClientModalOpen(true)}
                            className="hover:opacity-80 transition-opacity"
                            aria-label="Просмотр информации о клиенте"
                        >
                            <Eye size={16} className="text-gray-600 hover:text-blue-600" />
                        </button>

                        <button
                            title="Редактировать"
                            onClick={() => handleUpdateOrder(order.order_id)}
                            className="hover:opacity-80 transition-opacity"
                            aria-label="Редактировать"
                        >
                            <Edit size={16} className="text-gray-600 hover:text-green-600" />
                        </button>
                    </div>
                </div>
            </div>
            <ClientInfoModal
                isOpen={clientModalOpen}
                onClose={() => setClientModalOpen(false)}
                clientName={order.leadName}
                clientPhone={order.phone}
                clientId={order.client_id}
                orderId={order.order_id}
            />
        </>
    )
}