import CustomerInfo from "@/app/form/components/OrderForm/components/CustomerInfo";
import DateAndTime from "@/app/form/components/OrderForm/components/DateAndTime";
import {User} from "@/hooks/useUserByAt";
interface Props {
    user: User;
    leadId?: string;
}
export default function OrderForm({ user, leadId }: Props) {
    return (
        <div>
            <CustomerInfo/>
            <DateAndTime/>
        </div>
    );
}
