import ClientInfoModal from "@/app/myOrders/components/ClientInfoModal"
import TransferOrderModal from "@/app/myOrders/components/TransferOrderModal"
import { useOrderStore } from "@/stores/orderStore"
import { OrderStatus } from "@/types/api"
import Order from "@/types/formDataType"
import {
    ArrowRight,
    Calendar,
    Edit,
    Eye,
    FileText,
    MapPin, Package,
    Undo2,
    User
} from 'lucide-react'
import { useRouter } from "next/navigation"
import React, { useMemo, useState } from 'react'
import toast from "react-hot-toast"

// helpers
export type MongoDate = string | { $date: string }
export type MongoId   = string | { $oid: string }
function readOid(v?: MongoId) { if (!v) return undefined; return typeof v === 'string' ? v : v.$oid }
function readDate(v?: MongoDate): Date | undefined {
    if (!v) return undefined;
    if (typeof v === 'string') { const d = new Date(v.trim()); return isNaN(+d) ? undefined : d }
    const d = new Date(v.$date); return isNaN(+d) ? undefined : d
}
function formatDateTime(d?: Date) {
    if (!d) return ''
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' в ' + d.toLocaleTimeString('ru-RU', { hour: 'numeric', minute: '2-digit' })
}

// status colors/labels
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
    [OrderStatus.OTHER_REGION]: 'Другой регион',
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
const ruToEnum: Record<string, OrderStatus> = {
    'Отменен': OrderStatus.CANCELLED,
    'Другой регион': OrderStatus.OTHER_REGION,
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

export default function OrderCardPretty({ order }: OrderCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [statusOpen, setStatusOpen] = useState(false)
    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)

    const changeStatus = useOrderStore(state => state.changeStatus)
    const updateOrder  = useOrderStore(state => state.getByLeadID);
    const transferOrderToBuffer = useOrderStore(state => state.transferOrderToBuffer)
    const takeOrderBackFromBuffer = useOrderStore(state => state.takeOrderBackFromBuffer)
    const currentUser = useOrderStore(state => state.currentUser)
    const router = useRouter();

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
    
    const currentStatus: OrderStatus = order.text_status ? ruToEnum[order.text_status] || OrderStatus.ORDER_STATUS : OrderStatus.ORDER_STATUS
    
    // Определяем, есть ли у заказа статус
    const hasStatus = Boolean(order.text_status && order.text_status.trim())
    
    // Текст статуса для отображения
    const statusDisplayText = hasStatus ? statusLabel[currentStatus] : 'Без статуса'

    const disabledAll = order.transfer_status === "in_buffer"

    const handleChangeStatus = (st: OrderStatus) => {
        changeStatus(statusLabel[st], order.order_id);
    }

    const handleUpdateOrder = async (leadId: string) => {
        const found = await updateOrder(leadId);
        if (found) router.push("/changeOrder")
    }

    const handleReturnFromBuffer = async () => {
        const ok = await takeOrderBackFromBuffer(order.order_id,order.transferred_to_team);
        if (ok) toast.success("Order returned from buffer");
    }

    // перенос (передача) заказа
    const handleTransfer = async (targetTeam: 'A' | 'B' | 'C' | 'INTERNAL', comment?: string) => {
        if (targetTeam === 'INTERNAL') {
            await transferOrderToBuffer(order.order_id, currentUser?.team, comment);
        } else {
            await transferOrderToBuffer(order.order_id, targetTeam, comment);
        }
        setIsTransferModalOpen(false);
        toast.success("Order sent to buffer");
        await useOrderStore.getState().fetchOrders();

    }

    // UI helpers
    const mainLabel = order.services?.[0]?.label
    const extras = (order.services?.[0]?.addons?.length || 0) + (order.services?.[0]?.materials?.length || 0)
    const servicesSummary = mainLabel ? `${mainLabel}${extras ? ` +${extras} доп.` : ''}` : '—'
    const serviceChips = [...(order.services?.map(s => s.label) || [])]
    const materialChips = [...(order.services?.flatMap(s => (s.materials || []).map(m => m.label)) || [])]
    const desc = order.comment || ''
    const short = desc.length > 120 && !expanded ? desc.slice(0, 120) + '…' : desc

    React.useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!(e.target as HTMLElement).closest?.('[data-status-root]')) setStatusOpen(false)
        }
        if (statusOpen) document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [statusOpen])

    const displayDateTime = useMemo(() => {
        if (order.time && /am|pm/i.test(order.time)) return `${order.date || ''} ${order.time}`.trim();
        if (order.date && /am|pm/i.test(order.date)) return order.date;
        const d = (order.date && order.date.trim()) ? readDate(order.date) : readDate(order.date);
        return d ? formatDateTime(d) : '';
    }, [order.date, order.time, order.createdAt]);

    return (
        <>
            <div className={`border rounded-2xl shadow-sm p-4 relative transition-all duration-300 ${
                disabledAll ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
            }`} data-status-root>

                {/* Banner while in buffer */}
                {disabledAll && (
                    <div className="mb-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="text-yellow-600"><Package size={16} /></div>
                                <div>
                                    <div className="text-sm font-medium text-yellow-800">
                                        In buffer at Team {order.transferred_to_team || 'Unknown'}
                                    </div>
                                    <div className="text-xs text-yellow-600">Waiting for acceptance</div>
                                </div>
                            </div>
                            <button
                                onClick={handleReturnFromBuffer}
                                className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                                title="Return from buffer"
                            >
                                <Undo2 size={12} />
                                Return
                            </button>
                        </div>
                    </div>
                )}

                {/* Header & status */}
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">ID: {order.order_id}</h3>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => !disabledAll && setStatusOpen(v => !v)}
                            disabled={disabledAll}
                            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
                                disabledAll ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            }`}
                            style={{
                                backgroundColor: statusColors[currentStatus].bg,
                                color: statusColors[currentStatus].text,
                                borderColor: 'rgba(0,0,0,.08)'
                            }}
                            aria-haspopup="listbox"
                            aria-expanded={statusOpen}
                            title={disabledAll ? "Заказ в буфере — изменение статуса недоступно" : "Изменить статус"}
                        >
                            {statusDisplayText}
                        </button>

                        {statusOpen && !disabledAll && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-80 overflow-auto" role="listbox">
                                {availableStatuses.map((st) => (
                                    <button
                                        key={st}
                                        role="option"
                                        aria-selected={st === currentStatus}
                                        onClick={() => { setStatusOpen(false); handleChangeStatus(st); }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${st===currentStatus ? 'bg-gray-50' : ''}`}
                                    >
                    <span className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: statusColors[st].bg, outline: '1px solid rgba(0,0,0,.06)' }} />
                                        <span className="flex-1">{statusLabel[st]}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Client */}
                <div className="mt-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-600" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {order.leadName || 'Без имени'}
                        </div>
                        <div className="text-sm text-gray-500">
                            Client ID: #{String(order.client_id ?? '').toString().padStart(5, '0')}
                        </div>
                    </div>
                </div>

                {/* Address & date */}
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

                {/* Services */}
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

                {/* Description */}
                {(desc && desc.trim()) && (
                    <div className="mt-4">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                            <FileText size={16} className="text-gray-800" />
                            <span>Описание:</span>
                        </div>
                        <div className="mt-1 bg-blue-50 text-gray-800 rounded-xl px-3 py-2 text-sm">
                            {short}
                            {desc.length > 120 && !disabledAll && (
                                <button className="ml-2 text-blue-600 underline" onClick={() => setExpanded(v => !v)}>
                                    {expanded ? 'Скрыть' : 'Показать все'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Total & actions */}
                <div className="mt-5 flex items-center justify-between">
                    <div className="text-2xl font-bold flex items-center gap-2">
                    {order.custom ? (
                        <span>{`$${order.custom.toFixed(2)}`}</span>
                        ) : (
                        <span>{`$${order.total ? order.total.toFixed(2) : '0.00'}`}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            title={disabledAll ? "Заказ в буфере — просмотр недоступен" : "Просмотр клиента"}
                            onClick={() => !disabledAll && setClientModalOpen(true)}
                            disabled={disabledAll}
                            className="hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                            <Eye size={16} className="text-gray-600 hover:text-blue-600" />
                        </button>

                        <button
                            title={disabledAll ? "Заказ в буфере — редактирование недоступно" : "Редактировать"}
                            onClick={() => !disabledAll && handleUpdateOrder(order.order_id)}
                            disabled={disabledAll}
                            className="hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                            <Edit size={16} className="text-gray-600 hover:text-green-600" />
                        </button>

                        {/* ВАЖНО: теперь кнопка передачи реально открывает модалку */}
                        {order.text_status === "Другой регион" && (
                            <button
                                title={disabledAll ? "Заказ в буфере — передача недоступна" : "Передать заказ"}
                                onClick={() => !disabledAll && setIsTransferModalOpen(true)}
                                disabled={disabledAll}
                                className="hover:opacity-80 transition-opacity disabled:opacity-50"
                                aria-label="Transfer Order"
                            >
                                <ArrowRight size={20} className="text-gray-600 hover:text-blue-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* модалки */}
            <TransferOrderModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                orderId={order.order_id}
                currentTeam={order.team as 'A' | 'B' | 'C'}
                onTransfer={handleTransfer}
            />

            <ClientInfoModal
                isOpen={clientModalOpen && !disabledAll}
                onClose={() => setClientModalOpen(false)}
                clientName={order.leadName}
                clientPhone={order.phone}
                clientId={order.client_id}
                orderId={order.order_id}
            />
        </>
    )
}
