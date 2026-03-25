"use client";

import { Leaf, Github, Mail, Globe, Heart, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-surface border-t border-border mt-20 relative overflow-hidden">
            {/* Trang trí nền */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

                    {/* BRAND COLUMN */}
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary text-white shadow-md">
                                <Leaf size={20} fill="currentColor" />
                            </div>
                            <span className="font-black text-xl tracking-tighter">CARBON</span>
                        </div>
                        <p className="text-sm opacity-60 leading-relaxed font-medium">
                            Nền tảng ứng dụng AI hàng đầu giúp theo dõi, phân tích và giảm thiểu dấu chân Carbon cá nhân vì một tương lai xanh.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={<Github size={18} />} />
                            <SocialIcon icon={<Globe size={18} />} />
                            <SocialIcon icon={<Mail size={18} />} />
                        </div>
                    </div>

                    {/* QUICK LINKS */}
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-widest mb-6 opacity-40">Sản phẩm</h4>
                        <ul className="space-y-4">
                            <FooterLink href="/" label="Dashboard" />
                            <FooterLink href="/leaderboard" label="Bảng xếp hạng" />
                        </ul>
                    </div>

                    {/* RESOURCES */}
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-widest mb-6 opacity-40">Tài nguyên</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#" label="Về chúng tôi" />
                            <FooterLink href="#" label="Blog môi trường" />
                            <FooterLink href="#" label="API Documentation" />
                        </ul>
                    </div>

                    {/* NEWSLETTER / STATUS */}
                    <div className="bg-background/50 border border-border p-6 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <ShieldCheck size={18} />
                            Hệ thống bảo mật
                        </div>
                        <p className="text-xs opacity-50 font-medium">
                            Dữ liệu của bạn được mã hóa và bảo vệ theo tiêu chuẩn môi trường số bền vững.
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter bg-green-500/10 text-green-500 px-3 py-1 rounded-full w-fit">
                            <Zap size={10} fill="currentColor" /> System Operational
                        </div>
                    </div>
                </div>

                {/* BOTTOM BAR */}
                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold opacity-40 uppercase tracking-widest">
                    <p>© {year} Carbon Tracker Project. All rights reserved.</p>
                    <div className="flex items-center gap-1">
                        Made with <Heart size={14} className="text-red-500 fill-red-500 mx-1" /> by Khang Thinh
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <Link href={href} className="text-sm font-bold opacity-60 hover:opacity-100 hover:text-primary transition-all">
                {label}
            </Link>
        </li>
    );
}

function SocialIcon({ icon }: { icon: any }) {
    return (
        <button className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all">
            {icon}
        </button>
    );
}