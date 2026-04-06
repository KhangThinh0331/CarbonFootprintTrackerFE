"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, Plus, Medal, Star,
    Leaf, Loader2, X, Zap, CalendarDays, ChevronLeft, ChevronRight
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { challengeService, Challenge } from "@/src/services/challengeService";
import { useToast } from "@/src/context/toastContext";

export default function ChallengesPage() {
    const toast = useToast();

    // --- 2. STATE DỮ LIỆU & PHÂN TRANG ---
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>([]);

    // Phân trang (Backend Spring Boot mặc định page bắt đầu từ 0)
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // State cho Modal
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newChallenge, setNewChallenge] = useState<Challenge>({
        id: 0,
        title: "",
        description: "",
        points: 0,
        targetCo2: 0,
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const decodedToken: any = jwtDecode(token);
                const roles: string[] = decodedToken.roles || [];
                if (roles.includes("ROLE_ADMIN") || roles.includes("ADMIN")) {
                    setIsAdmin(true);
                }
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
    }, []);

    // --- 3. FETCH DATA KHI ĐỔI TRANG ---
    useEffect(() => {
        fetchChallenges(currentPage);
    }, [currentPage]);
    const fetchChallenges = async (page: number) => {
        setLoading(true);
        try {
            const res = await challengeService.getAllChallenges(page, 20);
            setChallenges(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (error) {
            toast.error("Không thể tải danh sách thử thách");
        } finally {
            setLoading(false);
        }
    };

    // --- 4. TẠO THỬ THÁCH MỚI ---
    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChallenge.title || !newChallenge.description || !newChallenge.startDate || !newChallenge.endDate) {
            return toast.error("Vui lòng điền đủ thông tin, bao gồm cả ngày tháng");
        }

        const [year, month, day] = newChallenge.startDate.split("-");
        const formattedStartDate = `${day}/${month}/${year}`;

        const [y, m, d] = newChallenge.endDate.split("-");
        const formattedEndDate = `${d}/${m}/${y}`;

        setIsCreating(true);
        try {
            await challengeService.createChallenge({ id: newChallenge.id, title: newChallenge.title, description: newChallenge.description, points: newChallenge.points, targetCo2: newChallenge.targetCo2, startDate: formattedStartDate, endDate: formattedEndDate });
            setShowModal(false);
            setNewChallenge({ id: 0, title: "", description: "", points: 0, targetCo2: 0, startDate: "", endDate: "" });
            toast.success("Đã tạo thử thách thành công!");
            setCurrentPage(0);
            fetchChallenges(0);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo");
        } finally {
            setIsCreating(false);
        }
    };

    if (loading && challenges.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-bold opacity-50 tracking-widest uppercase">Đang tải trang...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="max-w-6xl mx-auto px-4 py-12">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                            Thử thách <span className="text-orange-500">Cộng đồng</span> <Trophy className="text-orange-500" size={36} />
                        </h1>
                        <p className="opacity-50 mt-2 text-lg">Hoàn thành thử thách để nhận điểm xanh và cứu lấy trái đất.</p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Plus size={20} />
                            Tạo Thử thách mới
                        </button>
                    )}
                </header>

                {/* DANH SÁCH THỬ THÁCH */}
                {challenges.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed border-border rounded-[2.5rem] opacity-50">
                        <Medal className="mx-auto mb-4 w-16 h-16" />
                        <p className="text-lg">Hiện tại chưa có thử thách nào diễn ra.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                            {/* Overlay loading khi đang chuyển trang */}
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            )}

                            <AnimatePresence>
                                {challenges.map((challenge, index) => (
                                    <motion.div
                                        key={challenge.id || index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-surface border border-border rounded-[2rem] p-6 shadow-sm hover:border-orange-500/50 hover:shadow-orange-500/10 transition-all group flex flex-col relative overflow-hidden"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                <Zap size={24} />
                                            </div>
                                            <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                                                <Star size={14} /> {challenge.points} Điểm
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black mb-2 line-clamp-2">{challenge.title}</h3>
                                        <p className="text-sm opacity-60 mb-4 flex-grow line-clamp-3">
                                            {challenge.description}
                                        </p>

                                        {/* Hiển thị thời gian */}
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 w-fit px-3 py-1.5 rounded-lg mb-6">
                                            <CalendarDays size={14} />
                                            <span>{challenge.startDate} - {challenge.endDate}</span>
                                        </div>

                                        <div className="pt-4 border-t border-border flex justify-between items-center mt-auto">
                                            <div className="text-xs font-bold text-green-600 uppercase flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md">
                                                <Leaf size={14} /> - {challenge.targetCo2} kg CO₂
                                            </div>
                                            <button className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md">
                                                Tham gia
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* --- GIAO DIỆN PHÂN TRANG --- */}
                        {totalPages > 1 && (
                            <div className="p-6 border-t border-border flex justify-center items-center gap-8">
                                <button
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(0)}
                                    className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-20 transition-colors"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="flex gap-2 mx-2">
                                    {(() => {
                                        const pages = [];
                                        const range = 1; // Số lượng trang hiển thị quanh trang hiện tại

                                        for (let i = 0; i < totalPages; i++) {
                                            // Luôn hiện trang đầu, trang cuối, và các trang lân cận trang hiện tại
                                            if (
                                                i === 0 ||
                                                i === totalPages - 1 ||
                                                (i >= currentPage - range && i <= currentPage + range)
                                            ) {
                                                pages.push(
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i)}
                                                        className={`w-10 h-10 rounded-xl font-bold transition border ${currentPage === i
                                                            ? "bg-primary text-white border-primary"
                                                            : "bg-surface border-border hover:bg-border"
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                );
                                            }
                                            else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
                                                pages.push(
                                                    <span key={i} className="w-10 h-10 flex items-center justify-center opacity-50">
                                                        ...
                                                    </span>
                                                );
                                            }
                                        }
                                        return pages;
                                    })()}
                                </div>
                                <button
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage(totalPages - 1)}
                                    className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-20 transition-colors"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL TẠO THỬ THÁCH GIỮ NGUYÊN NHƯ CŨ */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface z-10">
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <Trophy className="text-orange-500" /> Thêm Thử Thách
                                </h3>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-muted rounded-full hover:bg-border transition"><X size={18} /></button>
                            </div>

                            <div className="p-8 overflow-y-auto">
                                <form id="challengeForm" onSubmit={handleCreateChallenge} className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">ID</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                                            value={newChallenge.id}
                                            onChange={(e) => setNewChallenge({ ...newChallenge, id: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Tên thử thách</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="VD: Tuần lễ đi xe buýt"
                                            className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                                            value={newChallenge.title}
                                            onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mô tả chi tiết</label>
                                        <textarea
                                            required
                                            placeholder="Mô tả cách thức tham gia..."
                                            rows={3}
                                            className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium resize-none"
                                            value={newChallenge.description}
                                            onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mục tiêu CO₂ (kg)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0.1"
                                                step="0.1"
                                                className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium text-center"
                                                value={newChallenge.targetCo2 || ""}
                                                onChange={(e) => setNewChallenge({ ...newChallenge, targetCo2: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Điểm thưởng</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium text-center text-green-600"
                                                value={newChallenge.points || ""}
                                                onChange={(e) => setNewChallenge({ ...newChallenge, points: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Ngày bắt đầu</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                                                value={newChallenge.startDate}
                                                onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Ngày kết thúc</label>
                                            <input
                                                type="date"
                                                required
                                                min={newChallenge.startDate}
                                                className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-orange-500/50 outline-none transition-all font-medium"
                                                value={newChallenge.endDate}
                                                onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-border bg-background/50 sticky bottom-0">
                                <button
                                    form="challengeForm"
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 hover:brightness-110 disabled:opacity-50 transition"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={20} /> : "Tạo và Công bố"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}