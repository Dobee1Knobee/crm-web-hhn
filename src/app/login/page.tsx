import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading…</div>}>
            <LoginForm />
        </Suspense>
    );
}
