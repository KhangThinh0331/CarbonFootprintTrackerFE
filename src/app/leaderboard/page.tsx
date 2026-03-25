"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Medal,
    Award,
    User as UserIcon,
    Leaf,
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
    username: string;
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

export default function LeaderboardPage() {
    const toast = useToast();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    // States cho Filter & Search
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBadge, setSelectedBadge] = useState("Tất cả");

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await leaderboardService.getMonthlyRanking();
                setUsers(res.data);
            } catch (error) {
                toast.error("Lỗi tải bảng xếp hạng");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [toast]);

    // Logic lọc dữ liệu tổng hợp
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBadge = selectedBadge === "Tất cả" || user.badge === selectedBadge;
            return matchesSearch && matchesBadge;
        });
    }, [users, searchQuery, selectedBadge]);

    // Trạng thái hiển thị
    const isFiltering = searchQuery.length > 0 || selectedBadge !== "Tất cả";
    const topThree = isFiltering ? [] : filteredUsers.slice(0, 3);
    const displayList = isFiltering ? filteredUsers : filteredUsers.slice(3);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold opacity-50 tracking-widest uppercase">Đang tải bảng vàng...</p>
            </div>
        );
    }

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
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-surface border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold shadow-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/5 rounded-full">
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

                {/* 3. PODIUM (Chỉ hiện khi ở trạng thái mặc định) */}
                {!isFiltering && topThree.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-6 px-4">
                        {topThree[1] && <PodiumCard user={topThree[1]} rank={2} color="text-slate-400" />}
                        {topThree[0] && <PodiumCard user={topThree[0]} rank={1} color="text-primary" isMain={true} />}
                        {topThree[2] && <PodiumCard user={topThree[2]} rank={3} color="text-orange-500" />}
                    </div>
                )}

                {/* 4. LIST SECTION */}
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
                                    key={user.username}
                                    layout
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`bg-surface border border-border rounded-[1.5rem] p-4 flex items-center justify-between hover:border-primary/30 transition-all group shadow-sm ${user.rank <= 3 ? "ring-1 ring-primary/10" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-8 text-sm font-black opacity-30 group-hover:opacity-100 transition-opacity">
                                            #{user.rank}
                                        </span>

                                        <UserAvatar user={user} size="sm" />

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm leading-none">{user.username}</p>
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
                                    onClick={() => { setSearchQuery(""); setSelectedBadge("Tất cả"); }}
                                    className="mt-4 text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                                >
                                    Đặt lại bộ lọc
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

// Sub-components giữ nguyên logic Avatar và PodiumCard của bạn
function UserAvatar({ user, size = "md" }: { user: LeaderboardUser, size?: "sm" | "md" | "lg" }) {
    const [imgError, setImgError] = useState(false);
    const initial = user.username.charAt(0).toUpperCase();
    const dimensions = { sm: "w-10 h-10 text-sm", md: "w-16 h-16 text-xl", lg: "w-20 h-20 text-2xl" };

    return (
        <div className={`${dimensions[size]} rounded-full bg-background border-2 border-border overflow-hidden flex items-center justify-center shrink-0 shadow-inner`}>
            {user.avatarUrl && !imgError ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" onError={() => setImgError(true)} />
            ) : (
                <span className="font-black opacity-30">{initial}</span>
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
                    <h3 className="font-black text-lg line-clamp-1 leading-tight">{user.username}</h3>
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