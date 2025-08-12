// app/login/LoginForm.tsx  (Next.js App Router)
// Если путь к стору другой — поправь импорт ниже.
"use client"
import "@/app/global.css"

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import Image from "next/image";
import icon from "../../../public/yellowpng.webp"
export default function LoginPage() {
    const login = useOrderStore((s) => s.login);
    const router = useRouter();
    const search = useSearchParams();

    const [at, setAt] = useState('');
    const [pwd, setPwd] = useState('');
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!at.trim() || !pwd) return;
        setLoading(true);
        try {
            await login(at.trim(), pwd);


            router.push(search?.get('next') || '/myOrders');
        } finally {
            setLoading(false);
        }
    }



    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 rounded-t-2xl flex-row justify-content-center" />
                <Image
                    src={icon}
                    alt="icon"
                    height={100}
                    width={100}
                    className="mx-auto my-6"
                />
                <form onSubmit={onSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Telegram @</label>
                        <input
                            value={at}
                            onChange={(e) => setAt(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none
                         focus:border-sky-400 focus:ring-4 focus:ring-sky-200/60 transition"
                            placeholder="@username"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Пароль</label>
                        <input
                            type="password"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none
                         focus:border-sky-400 focus:ring-4 focus:ring-sky-200/60 transition"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl px-4 py-2 font-semibold text-white shadow-md transition
                       bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 hover:opacity-95 disabled:opacity-60"
                    >
                        {loading ? 'Входим…' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
}
