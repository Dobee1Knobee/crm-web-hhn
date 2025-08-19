"use client"
import Masters from "@/app/changeOrder/components/Masters"
import OrderDescription from "@/app/changeOrder/components/OrderDescription"
import ServicesWindow from "@/app/changeOrder/components/ServicesWindow"
import Cities from "@/app/form/components/OrderForm/components/Cities"
import CustomerInfo from "@/app/form/components/OrderForm/components/CustomerInfo"
import DateAndTime from "@/app/form/components/OrderForm/components/DateAndTime"
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