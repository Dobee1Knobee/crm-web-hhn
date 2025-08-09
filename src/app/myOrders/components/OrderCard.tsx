import React, { useMemo, useState } from 'react'
import {useOrderStore} from "@/stores/orderStore";
import Order from "@/types/formDataType";

// Тип под твой документ из Mongo (без жёстких зависимостей)
export type MongoDate = string | { $date: string }
export type MongoId   = string | { $oid: string }

export type OrderDoc = {
    _id?: MongoId
    owner?: string
    order_id: string
    address?: string
    client_id?: number | string
    zip_code?: string
    team?: string
    date?: string // может быть пустая строка " "
    manager_id?: string
    miles?: any[]
    response_time?: any[]
    text_status?: string // «Оформлен», «В работе» и т.п.
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
function currency(n?: number, sym: string = '$') {
    const v = typeof n === 'number' ? n : 0
    return sym + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

// Палитра для бейджа статуса (по русскому статусу)
const STATUS_MAP: Record<string, { bg: string; text: string }> = {
    'В работе': { bg: 'bg-yellow-300', text: 'text-black' },
    'Оформлен': { bg: 'bg-blue-200', text: 'text-blue-900' },
    'Завершен': { bg: 'bg-emerald-200', text: 'text-emerald-900' },
    'Отменен':  { bg: 'bg-red-200', text: 'text-red-900' },
    'Невалидный': { bg: 'bg-gray-200', text: 'text-gray-800' },
    'Нужно подтверждение': { bg: 'bg-orange-200', text: 'text-orange-900' },
    'Ночной ранний': { bg: 'bg-purple-200', text: 'text-purple-900' },
}

export type OrderCardProps = {
    order: Order
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onChangeStatus?: (id: string,st:string) => void

}
// onChangeStatus={(id, st) => changeStatus(st, id)}

export default function OrderCardPretty({ order, onView, onEdit, onChangeStatus }: OrderCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const changeStatus = useOrderStore(state => state.changeStatus)

    // === Status enum & palettes ===
    // Если в проекте уже есть enum OrderStatus — удали тип ниже и импортни свой.
    type OrderStatus =
        | 'CANCELLED' | 'OTHER_REGION' | 'INVALID' | 'NO_ANSWER' | 'IN_WORK'
        | 'NIGHT' | 'NIGHT_EARLY' | 'NEED_CONFIRMATION' | 'NEED_APPROVAL'
        | 'COMPLETED' | 'CALL_TOMORROW' | 'ORDER_STATUS'

    const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
        CANCELLED:       { bg: '#470909', text: '#ffffff' },
        OTHER_REGION:    { bg: '#00e5ff', text: '#000000' },
        INVALID:         { bg: '#f44336', text: '#ffffff' },
        NO_ANSWER:       { bg: '#9e9e9e', text: '#ffffff' },
        IN_WORK:         { bg: '#ffff00', text: '#000000' },
        NIGHT:           { bg: '#1976d2', text: '#ffffff' },
        NIGHT_EARLY:     { bg: '#bfe1f6', text: '#000000' },
        NEED_CONFIRMATION:{ bg: '#76ff03', text: '#000000' },
        NEED_APPROVAL:   { bg: '#ffa726', text: '#000000' },
        COMPLETED:       { bg: '#2e7d32', text: '#ffffff' },
        CALL_TOMORROW:   { bg: '#e6cff1', text: '#000000' },
        ORDER_STATUS:    { bg: '#e0e0e0', text: '#000000' },
    }

    const statusLabel: Record<OrderStatus, string> = {
        CANCELLED: 'Отменен',
        OTHER_REGION: 'Другая область',
        INVALID: 'Невалидный',
        NO_ANSWER: 'Нет ответа',
        IN_WORK: 'В работе',
        NIGHT: 'Ночной',
        NIGHT_EARLY: 'Ночной ранний',
        NEED_CONFIRMATION: 'Нужно подтверждение',
        NEED_APPROVAL: 'Нужно согласование',
        COMPLETED: 'Завершен',
        CALL_TOMORROW: 'Перезвон завтра',
        ORDER_STATUS: 'Оформлен',
    }

    const ruToEnum: Record<string, OrderStatus> = {
        'Отменен': 'CANCELLED',
        'Другая область': 'OTHER_REGION',
        'Невалидный': 'INVALID',
        'Нет ответа': 'NO_ANSWER',
        'В работе': 'IN_WORK',
        'Ночной': 'NIGHT',
        'Ночной ранний': 'NIGHT_EARLY',
        'Нужно подтверждение': 'NEED_CONFIRMATION',
        'Нужно согласование': 'NEED_APPROVAL',
        'Завершен': 'COMPLETED',
        'Перезвон завтра': 'CALL_TOMORROW',
        'Оформлен': 'ORDER_STATUS',
    }

    const availableStatuses: OrderStatus[] = [
        'IN_WORK','NEED_CONFIRMATION','NEED_APPROVAL','CALL_TOMORROW','NIGHT','NIGHT_EARLY','OTHER_REGION','COMPLETED','CANCELLED','INVALID','ORDER_STATUS'
    ]

    const handleChangeStatus = (st: OrderStatus) => {
        const ru = statusLabel[st];                 // "Ночной", "В работе" и т.д.
        const leadId = order.order_id;              // именно ID заказа
        changeStatus(ru, leadId);
    }
    // ID для действий
    const oid = readOid(order._id) || order.order_id

    // Текущий статус: из order.text_status (RU) → enum
    const currentStatus: OrderStatus = ruToEnum[order.text_status || 'Оформлен'] || 'ORDER_STATUS'

    // Время: приоритет — поле date (если не пустое), иначе createdAt
    const fromDate = useMemo(() => {
        const d = (order.date && order.date.trim()) ? readDate(order.date) : readDate(order.createdAt)
        return d
    }, [order.date, order.createdAt])

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
        // Если есть отдельное поле time с am/pm
        if (order.time && /am|pm/i.test(order.time)) {
            return `${order.date || ''} ${order.time}`.trim();
        }

        // Если в order.date есть am/pm
        if (order.date && /am|pm/i.test(order.date)) {
            return order.date;
        }

        // Если нормальная дата
        const d = (order.date && order.date.trim())
            ? readDate(order.date)
            : readDate(order.createdAt);
        return d ? formatDateTime(d) : '';
    }, [order.date, order.time, order.createdAt]);

    return (
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
                        style={{ backgroundColor: statusColors[currentStatus].bg, color: statusColors[currentStatus].text, borderColor: 'rgba(0,0,0,.08)' }}
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
                                    onClick={() => { setStatusOpen(false); handleChangeStatus(st); /* ... */ }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${st===currentStatus ? 'bg-gray-50' : ''}`}
                                >
                                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[st].bg, outline: '1px solid rgba(0,0,0,.06)' }} />
                                    <span className="flex-1">{statusLabel[st]}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Клиент */}
            <div className="mt-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xl">👤</div>
                <div>
                    <div className="font-semibold text-gray-900 flex items-center gap-2">{order.leadName || 'Без имени'} <span className="text-sm">📱</span></div>
                    <div className="text-sm text-gray-500">Client ID: #{String(order.client_id ?? '').toString().padStart(5, '0')}</div>
                </div>
            </div>

            {/* Адрес и дата */}
            <div className="mt-3 space-y-1 text-sm text-gray-700">
                {(order.address || order.zip_code) && (
                    <div>📍 {order.address}{order.zip_code ? `, ${order.zip_code}` : ''}</div>
                )}
                {displayDateTime && (
                    <div>📅 {displayDateTime}</div>
                )}
            </div>

            {/* Услуги */}
            <div className="mt-4">
                <div className="font-semibold text-gray-800">📦 Услуги:</div>
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
                    <div className="font-semibold text-gray-800">📝 Описание:</div>
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
                <div className="text-2xl font-bold">💰 {currency(order.total)}</div>
                <div className="flex items-center gap-3">
                    <button title="Просмотр" onClick={() => onView?.(String(oid))} className="hover:opacity-80" aria-label="Просмотр">👁️</button>
                    <button title="Редактировать" onClick={() => onEdit?.(String(oid))} className="hover:opacity-80" aria-label="Редактировать">✏️</button>
                </div>
            </div>
        </div>
    )
}

// Пример использования:
// <OrderCardPretty
//   order={orderFromMongo}
//   onView={(id) => router.push(`/orders/${id}`)}
//   onEdit={(id) => router.push(`/orders/${id}/edit`)}
//   onChangeStatus={(id) => updateStatus(id)} // верни из дропдауна конкретный статус — см. комментарий внутри
// />
