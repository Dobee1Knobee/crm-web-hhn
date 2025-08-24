import { Suspense } from "react";
import LoginForm from "./LoginForm";
import AuthRedirect from "@/components/AuthRedirect";

export const dynamic = "force-dynamic";

export default function Page() {
    return (
        <AuthRedirect>
            <Suspense fallback={<div className="p-6">Loading…</div>}>
                <LoginForm />
            </Suspense>
        </AuthRedirect>
    );
}
