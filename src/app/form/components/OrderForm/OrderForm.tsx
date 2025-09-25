"use client"
import OrderDescription from "@/app/changeOrder/components/OrderDescription"
import ServicesWindow from "@/app/changeOrder/components/ServicesWindow"
import Cities from "@/app/form/components/OrderForm/components/Cities"
import CustomerInfo from "@/app/form/components/OrderForm/components/CustomerInfo"
import DateAndTime from "@/app/form/components/OrderForm/components/DateAndTime"
import Masters from "@/app/form/components/OrderForm/components/Masters"
import { User } from "@/hooks/useUserByAt"
import { useOrderStore } from "@/stores/orderStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
    user: User;
    leadId?: string;
}

export default function OrderForm({ leadId }: Props) {
    const router = useRouter();
    
    // Безопасно извлекаем команду как строку
    const user = useOrderStore(state => state.currentUser)
    const team = typeof user?.team === 'string' ? user.team : user?.team ?? 'A';
    const city = useOrderStore(state => state.formData.city);
    const teamId = useOrderStore(state => state.formData.teamId);
    const shouldRedirectToMyOrders = useOrderStore(state => state.shouldRedirectToMyOrders);
    const { updateFormData} = useOrderStore();
    


    // Устанавливаем команду пользователя в store при загрузке только если teamId === "Init"
    useEffect(() => {
        if (team && teamId === "Init") {
            updateFormData('teamId', team);
           useOrderStore.setState({currentLeadID: ""})
        }
    }, [team, teamId, updateFormData]);

    // Инициализация даты и времени из существующих данных заказа
    useEffect(() => {
        const currentFormData = useOrderStore.getState().formData;
        console.log('OrderForm: Initializing with formData:', currentFormData);
        
        // Проверяем, что это не changeOrder (если есть leadId, значит это changeOrder)
        if (leadId) {
            console.log('OrderForm: This is changeOrder, skipping initialization');
            return;
        }
        
        // Безопасно обрабатываем dateSlots - может быть строкой или массивом
        let dateSlotsArray: string[] = [];
        if (currentFormData.dateSlots) {
            if (Array.isArray(currentFormData.dateSlots)) {
                // Если это массив, обрабатываем каждый элемент
                currentFormData.dateSlots.forEach((item: any) => {
                    if (typeof item === 'string') {
                        // Если элемент содержит запятые, разбиваем его
                        if (item.includes(',')) {
                            dateSlotsArray.push(...item.split(',').filter((slot: string) => slot.trim().length > 0));
                        } else {
                            dateSlotsArray.push(item);
                        }
                    }
                });
            } else if (typeof currentFormData.dateSlots === 'string') {
                // Если это строка, разбиваем по запятой
                const slotsString = currentFormData.dateSlots as string;
                if (slotsString.length > 0) {
                    dateSlotsArray = slotsString.split(',').filter((slot: string) => slot.trim().length > 0);
                }
            }
        }
        
        console.log('OrderForm: Parsed dateSlots array:', dateSlotsArray);
        
        // Если у нас есть существующие слоты, извлекаем дату и время
        if (dateSlotsArray.length > 0) {
            const firstSlot = dateSlotsArray[0];
            if (firstSlot) {
                const parts = firstSlot.split('-');
                
                // Устанавливаем дату
                const dateFromSlot = parts[1]; // Формат: YYYY-MM-DD
                if (dateFromSlot && dateFromSlot.match(/^\d{4}-\d{2}-\d{2}$/) && !currentFormData.date) {
                    console.log('OrderForm: Auto-setting date from slot:', dateFromSlot);
                    // Убираем updateFormData отсюда, чтобы избежать бесконечного цикла
                }
                
                // Устанавливаем время
                const hour = parts[4];
                const amPM = parts[5];
                if (hour && amPM && !currentFormData.time) {
                    const timeValue = hour + amPM;
                    console.log('OrderForm: Auto-setting time from slot:', timeValue);
                    // Убираем updateFormData отсюда, чтобы избежать бесконечного цикла
                }
            }
        }
    }, [leadId]) // Убираем updateFormData из зависимостей

    useEffect(() => {
        
        console.log(team)
    })

    // 🔄 Отслеживаем событие перехода на myOrders
    useEffect(() => {
        if (shouldRedirectToMyOrders) {
            console.log('🔄 Redirecting to My Orders...');
            
            // Сбрасываем флаг
            useOrderStore.setState({ shouldRedirectToMyOrders: false });
            
            // Переходим на страницу myOrders через 2 секунды
                router.push('/myOrders');
          
        }
    }, [shouldRedirectToMyOrders, router]);

    // Показываем Cities только если команда менеджера совпадает или это новый заказ (Init)
    const shouldShowCities = teamId === "Init" || user?.team === teamId;

    return (
        <div className="space-y-6">
            <CustomerInfo/>
            <DateAndTime/>
            {shouldShowCities && (
                <Cities team={team}/>
            )}
            <Masters team={team} city={city} />
            <OrderDescription/>
            <ServicesWindow/>
        </div>
    );
}