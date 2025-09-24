"use client"
import CustomerInfo from "@/app/changeOrder/components/CustomerInfo"
import DateAndTime from "@/app/changeOrder/components/DateAndTime"
import Masters from "@/app/changeOrder/components/Masters"
import OrderDescription from "@/app/changeOrder/components/OrderDescription"
import ServicesWindow from "@/app/changeOrder/components/ServicesWindow"
import Cities from '@/app/form/components/OrderForm/components/Cities'
import { User } from "@/hooks/useUserByAt"
import { useOrderStore } from "@/stores/orderStore"
import { useEffect } from "react"

interface Props {
    user: User;
    leadId?: string;
}

export default function OrderForm({ user, leadId }: Props) {
    const team = user?.team?.toString() || "A";
    const city = useOrderStore(state => state.formData.city);
    const shouldShowCities = team === "Init" || user?.team === team;

    useEffect(() => {
        console.log("TEAM:", team);

        console.log("CITY:", city); // проверка
    }, [team, city]);
    useEffect(() => {
        console.log(team)
    })

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