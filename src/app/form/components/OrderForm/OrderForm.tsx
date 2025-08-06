"use client"
import CustomerInfo from "@/app/form/components/OrderForm/components/CustomerInfo";
import DateAndTime from "@/app/form/components/OrderForm/components/DateAndTime";
import {User} from "@/hooks/useUserByAt";
import Cities from "@/app/form/components/OrderForm/components/Cities";
import {useEffect} from "react";
import OrderDescription from "@/app/form/components/OrderForm/components/OrderDescription";
import ServicesWindow from "@/app/form/components/OrderForm/components/ServicesWindow";
import Masters from "@/app/form/components/OrderForm/components/Masters";

interface Props {
    user: User;
    leadId?: string;
}

export default function OrderForm({ user, leadId }: Props) {
    const team = user?.team?.toString() ?? 'A';
    const city  = "New_York"
    useEffect(() => {
        console.log(team)
    })

    return (
        <div className="space-y-6">
            <CustomerInfo/>
            <DateAndTime/>
            <Cities team={team} />
            <Masters team={team} city={city} />
            <OrderDescription/>
            <ServicesWindow/>
        </div>
    );
}