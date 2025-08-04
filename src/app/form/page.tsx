"use client";
import "@/app/global.css";
import { useUserByAt } from "@/hooks/useUserByAt";
import { useOrders } from "@/hooks/useOrders";
import {OrderStatus} from "@/types/api";
import Header from "@/app/form/components/Header";
import StatusPills from "@/app/form/components/StatusPills";
import OrderForm from "@/app/form/components/OrderForm/OrderForm";

export default function Home() {
    const at = "devapi1"
    const user = useUserByAt("devapi1");
    useOrders({ username: "devapi1" });
    if (!user) return null;

    return (
        <div className="">
                    <Header />
                    <StatusPills/>
            <OrderForm user={user}/>
        </div>
    );
}
