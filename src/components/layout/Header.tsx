"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Leaf,
    LogOut,
    Trophy,
    User as UserIcon,
    Moon,
    Sun,
    ChevronDown,
    LogIn,
    UserPlus,
    LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { userService } from "@/src/services/userService";
import { useToast } from "@/src/context/toastContext";
import { useTheme } from "next-themes";

export default function Header() {
    const router = useRouter();
    const toast = useToast();
    const { theme, setTheme } = useTheme();

    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-600', 'bg-yellow-600',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        // Tính tổng mã ASCII của các ký tự trong tên để chọn màu
        const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[charCodeSum % colors.length];
    };

    useEffect(() => {
        setMounted(true);
        const fetchUser = async () => {
            try {
                const res = await userService.getMyProfile();
                setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) return null;

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/login");
        toast.success("Đã đăng xuất");
    };

    return (
        <motion.nav
            animate={{ height: scrolled ? 70 : 90 }}
            className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
                ? "bg-background/80 backdrop-blur-lg border-border shadow-sm"
                : "bg-transparent border-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="p-2.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Leaf size={22} fill="currentColor" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl tracking-tighter leading-none">CARBON</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Tracker</span>
                    </div>
                </Link>

                {/* CENTER NAV (DESKTOP) */}
                <div className="hidden md:flex items-center bg-surface/50 border border-border p-1.5 rounded-2xl gap-1">
                    <NavLink href="/" icon={<LayoutDashboard size={16} />} label="Bảng điều khiển" />
                    <NavLink href="/leaderboard" icon={<Trophy size={16} />} label="Xếp hạng" />
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-3">

                    {/* THEME TOGGLE */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-2xl hover:bg-primary/10 text-foreground/70 hover:text-primary transition-all"
                    >
                        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

                    {loading ? (
                        <div className="w-10 h-10 rounded-full bg-surface animate-pulse border border-border" />
                    ) : user ? (
                        /* USER LOGGED IN */
                        <div className="relative">
                            <button
                                onClick={() => setOpen(!open)}
                                className="flex items-center gap-2 p-1 pr-3 rounded-2xl hover:bg-surface border border-transparent hover:border-border transition-all"
                            >
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-lg font-bold ${getAvatarColor(user.fullName || "User")}`}>
                                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"}
                                        </div>
                                    )}
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                            </button>

                            <AnimatePresence>
                                {open && (
                                    <>
                                        <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-56 bg-surface border border-border rounded-[2rem] shadow-2xl p-2 overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-border/50 mb-1">
                                                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Tài khoản</p>
                                                <p className="font-bold truncate">{user.fullName}</p>
                                            </div>
                                            <Link
                                                href="/profile"
                                                onClick={() => setOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <UserIcon size={18} /> Hồ sơ của tôi
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 rounded-2xl hover:bg-red-500/10 transition-all"
                                            >
                                                <LogOut size={18} /> Đăng xuất
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        /* NOT LOGGED IN */
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 text-sm font-bold hover:text-primary transition-all"
                            >
                                <LogIn size={18} /> Đăng nhập
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 shadow-lg shadow-primary/20 transition-all"
                            >
                                <UserPlus size={18} /> Đăng ký
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold opacity-60 hover:opacity-100 hover:bg-background transition-all"
        >
            {icon} {label}
        </Link>
    );
}