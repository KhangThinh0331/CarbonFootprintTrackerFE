"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Medal,
    Award,
    Loader2,
    Crown,
    TrendingDown,
    Search,
    X,
    Filter
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { leaderboardService } from "@/src/services/leaderboardService";
import { useToast } from "@/src/context/toastContext";

interface LeaderboardUser {
    rank: number;
    fullName: string;
    totalCo2: number;
    badge: string;
    avatarUrl?: string;
}

const BADGES = [
    "Tất cả",
    "Người hùng Trái Đất",
    "Hiệp sĩ Xanh",
    "Mầm non Hy vọng",
    "Cư dân Tích cực"
];

// Custom hook để debounce giá trị search
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export default function LeaderboardPage() {
    const toast = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Lấy query từ URL nếu có khi vừa vào trang
    const initialQuery = searchParams.get('q') || "";
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [selectedBadge, setSelectedBadge] = useState("Tất cả");

    // Debounce search query (500ms)
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Cập nhật URL parameter khi gõ tìm kiếm (chỉ để đồng bộ URL)
    const handleSearchChange = (term: string) => {
        setSearchQuery(term);
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    // Fetch dữ liệu từ BE mỗi khi debouncedSearch thay đổi
    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                // BE giờ đã xử lý search theo tên
                const res = await leaderboardService.getMonthlyRanking(debouncedSearch);
                setUsers(res.data);
            } catch (error) {
                toast.error("Lỗi tải bảng xếp hạng");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [debouncedSearch, toast]);

    // Client-side filter: Chỉ còn giữ nhiệm vụ lọc theo Badge
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesBadge = selectedBadge === "Tất cả" || user.badge === selectedBadge;
            return matchesBadge;
        });
    }, [users, selectedBadge]);

    // Trạng thái hiển thị (ẩn bục vinh quang nếu đang search hoặc filter)
    const isFiltering = debouncedSearch.length > 0 || selectedBadge !== "Tất cả";
    const topThree = isFiltering ? [] : filteredUsers.slice(0, 3);
    const displayList = isFiltering ? filteredUsers : filteredUsers.slice(3);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
                {/* 1. HEADER */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-2"
                    >
                        <Trophy size={32} strokeWidth={2.5} />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tight">Bảng Xếp Hạng Tháng</h1>
                    <p className="opacity-60 max-w-md mx-auto italic font-medium">
                        "Hành động nhỏ, tác động lớn. Cùng nhau giảm dấu chân Carbon!"
                    </p>
                </div>

                {/* 2. BỘ LỌC & TÌM KIẾM (Sticky) */}
                <div className="sticky top-24 z-30 space-y-4 bg-background/80 backdrop-blur-md py-4 rounded-[2rem]">
                    {/* Search Bar */}
                    <div className="relative max-w-md mx-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm tên người dùng..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-surface border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold shadow-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => handleSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/5 rounded-full">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Badge Pills */}
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                        {BADGES.map((badge) => (
                            <button
                                key={badge}
                                onClick={() => setSelectedBadge(badge)}
                                className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all border ${selectedBadge === badge
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                                    : "bg-surface text-foreground/50 border-border hover:border-primary/50"
                                    }`}
                            >
                                {badge}
                            </button>
                        ))}
                    </div>
                </div>

                {/* STATE LOADING KHI SEARCH (UX) */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest">Đang tìm kiếm...</p>
                    </div>
                )}

                {/* 3. PODIUM (Chỉ hiện khi ở trạng thái mặc định & đã tải xong) */}
                {!loading && !isFiltering && topThree.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-6 px-4">
                        {topThree[1] && <PodiumCard user={topThree[1]} rank={2} color="text-slate-400" />}
                        {topThree[0] && <PodiumCard user={topThree[0]} rank={1} color="text-primary" isMain={true} />}
                        {topThree[2] && <PodiumCard user={topThree[2]} rank={3} color="text-orange-500" />}
                    </div>
                )}

                {/* 4. LIST SECTION */}
                {!loading && (
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {displayList.length > 0 && (
                            <div className="px-6 flex text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                <span className="w-12">Hạng</span>
                                <span className="flex-1">Người dùng</span>
                                <span className="text-right">Phát thải tháng này</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {displayList.map((user, index) => (
                                    <motion.div
                                        key={`${user.fullName}-${user.rank}`}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`bg-surface border border-border rounded-[1.5rem] p-4 flex items-center justify-between hover:border-primary/30 transition-all group shadow-sm ${user.rank <= 3 ? "ring-1 ring-primary/10" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Rank thực tế từ Backend */}
                                            <span className="w-8 text-sm font-black opacity-30 group-hover:opacity-100 transition-opacity">
                                                #{user.rank}
                                            </span>

                                            <UserAvatar user={user} size="sm" />

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm leading-none">{user.fullName}</p>
                                                    {user.rank <= 3 && <Crown size={12} className="text-yellow-500" />}
                                                </div>
                                                <p className="text-[10px] uppercase font-black tracking-widest opacity-40 text-primary mt-1">{user.badge}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-primary">
                                                <TrendingDown size={14} />
                                                <span className="font-black text-lg leading-none">{user.totalCo2.toFixed(1)}</span>
                                            </div>
                                            <p className="text-[10px] opacity-40 font-bold uppercase">kg CO₂</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* EMPTY STATE */}
                            {displayList.length === 0 && searchQuery !== "" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-surface border border-border border-dashed rounded-[3rem] p-20 text-center"
                                >
                                    <div className="inline-flex p-4 bg-foreground/5 rounded-full mb-4">
                                        <Filter size={32} className="opacity-20" />
                                    </div>
                                    <p className="font-bold opacity-40">Không tìm thấy kết quả phù hợp</p>
                                    <button
                                        onClick={() => { handleSearchChange(""); setSelectedBadge("Tất cả"); }}
                                        className="mt-4 text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                                    >
                                        Đặt lại bộ lọc
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

// Giữ nguyên các function UserAvatar và PodiumCard bên dưới
function UserAvatar({ user, size = "md" }: { user: LeaderboardUser, size?: "sm" | "md" | "lg" }) {
    const [imgError, setImgError] = useState(false);
    const initial = user.fullName.charAt(0).toUpperCase();
    const dimensions = { sm: "w-10 h-10 text-sm", md: "w-16 h-16 text-xl", lg: "w-20 h-20 text-2xl" };
    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-600', 'bg-yellow-600',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[charCodeSum % colors.length];
    };

    return (
        <div className={`${dimensions[size]} rounded-full bg-background border-2 border-border overflow-hidden flex items-center justify-center shrink-0 shadow-inner`}>
            {user.avatarUrl && !imgError ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
                <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(user.fullName || "User")}`}>
                    {initial}
                </div>
            )}
        </div>
    );
}

function PodiumCard({ user, rank, isMain = false }: { user: LeaderboardUser, rank: number, color: string, isMain?: boolean }) {
    const Icon = rank === 1 ? Crown : (rank === 2 ? Medal : Award);
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-surface border-2 rounded-[2.5rem] p-6 text-center transition-all ${isMain ? "border-primary shadow-2xl shadow-primary/10 pb-12 z-10 scale-110" : "border-border pb-8 opacity-90 scale-100"}`}
        >
            <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-surface border-2 flex items-center justify-center shadow-lg ${isMain ? "border-primary text-primary" : "border-border text-foreground/50"}`}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex justify-center">
                    <div className={isMain ? "ring-4 ring-primary/20 rounded-full" : ""}>
                        <UserAvatar user={user} size={isMain ? "lg" : "md"} />
                    </div>
                </div>
                <div>
                    <h3 className="font-black text-lg line-clamp-1 leading-tight">{user.fullName}</h3>
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mt-1">
                        {user.badge}
                    </span>
                </div>
                <div className="pt-2 border-t border-border/50">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-black tracking-tighter ${isMain ? "text-4xl" : "text-2xl"}`}>{user.totalCo2.toFixed(1)}</span>
                        <span className="text-xs font-bold opacity-40 uppercase">kg</span>
                    </div>
                </div>
            </div>
            {isMain && <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-[0.2em]">Champion</div>}
        </motion.div>
    );
}