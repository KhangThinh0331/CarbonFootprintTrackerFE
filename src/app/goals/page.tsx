"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target, Plus, TrendingUp, CheckCircle,
    Leaf, Loader2, X, Calendar, Filter
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { goalService, Goal } from "@/src/services/goalService";
import { useToast } from "@/src/context/toastContext";

const calculateDaysLeft = (deadlineStr: string) => {
    if (!deadlineStr) return null;

    let targetDate;
    if (deadlineStr.includes('/')) {
        const [day, month, year] = deadlineStr.split('/');
        targetDate = new Date(`${year}-${month}-${day}T23:59:59`);
    } else {
        targetDate = new Date(deadlineStr);
    }

    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function GoalsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // State cho bộ lọc (Filter)
    const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'>('ALL');

    const [isCreating, setIsCreating] = useState(false);
    const [newGoal, setNewGoal] = useState({ goalName: "", targetValue: "", deadline: "" });

    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [addedValue, setAddedValue] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // Cứ mỗi khi page hoặc filter thay đổi, gọi lại API
    useEffect(() => {
        fetchGoals(page, filter);
    }, [page, filter]);

    const fetchGoals = async (currentPage: number, currentFilter: string) => {
        try {
            // Truyền filter xuống service
            const res = await goalService.getMyGoals(currentPage, 5, currentFilter);
            setGoals(res.data.content || []);
            setTotalPages(res.data.totalPages || 0);
            console.log(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Không thể tải danh sách mục tiêu");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.goalName || !newGoal.targetValue || !newGoal.deadline) {
            return toast.error("Vui lòng điền đủ thông tin");
        }

        const [year, month, day] = newGoal.deadline.split("-");
        const formattedDeadline = `${day}/${month}/${year}`;

        setIsCreating(true);
        try {
            await goalService.createGoal({
                goalName: newGoal.goalName,
                targetValue: Number(newGoal.targetValue),
                deadline: formattedDeadline
            });
            setNewGoal({ goalName: "", targetValue: "", deadline: "" });
            toast.success("Đã tạo mục tiêu sống xanh mới!");

            setFilter('ALL');
            if (page === 0) fetchGoals(0, 'ALL');
            else setPage(0);

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi tạo mục tiêu.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal || !addedValue || Number(addedValue) <= 0) {
            return toast.error("Giá trị cập nhật không hợp lệ");
        }

        setIsUpdating(true);
        try {
            const res = await goalService.updateProgress(selectedGoal.id, Number(addedValue));
            setGoals(goals.map(g => g.id === selectedGoal.id ? res.data : g));
            setAddedValue("");
            setSelectedGoal(null);

            if (res.data.status === 'FAILED') {
                toast.error("Báo động đỏ! Bạn đã vượt quá mức CO₂ cho phép!");
            } else if (res.data.status === 'IN_PROGRESS') {
                const currentPercent = (res.data.currentValue / res.data.targetValue) * 100;
                if (currentPercent >= 90) {
                    toast.warning("Đã ghi nhận. Chú ý, bạn sắp vượt mức CO₂!");
                } else {
                    toast.success("Đã ghi nhận lượng phát thải mới!");
                }
            }
            fetchGoals(page, filter);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật tiến độ");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
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

            <main className="max-w-5xl mx-auto px-4 py-12">
                <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3">
                            Mục tiêu <span className="text-primary">Giảm Phát Thải</span> <Leaf className="text-primary" size={32} />
                        </h1>
                        <p className="opacity-50 mt-2">Theo dõi và chinh phục các cột mốc bảo vệ môi trường của bạn.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* CỘT TRÁI: FORM */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm sticky top-24">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                                <Plus className="text-primary" /> Thêm mục tiêu
                            </h2>
                            <form onSubmit={handleCreateGoal} className="space-y-4">
                                {/* ... (Giữ nguyên các input Form như cũ) ... */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Tên mục tiêu</label>
                                    <input
                                        type="text"
                                        placeholder="VD: Đạp xe đi làm 1 tháng"
                                        className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-primary/50 outline-none transition-all"
                                        value={newGoal.goalName}
                                        onChange={(e) => setNewGoal({ ...newGoal, goalName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mục tiêu CO₂ (kg)</label>
                                    <input
                                        type="number"
                                        placeholder="VD: 50"
                                        className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-primary/50 outline-none transition-all"
                                        value={newGoal.targetValue}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Ngày hoàn thành</label>
                                    <input
                                        type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        className="w-full mt-1 p-4 rounded-2xl border border-border bg-background/50 focus:border-primary/50 outline-none transition-all"
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full mt-4 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:brightness-110 flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Target size={20} />}
                                    Khởi tạo ngay
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* CỘT PHẢI: DANH SÁCH & FILTER */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* THANH BỘ LỌC (FILTER) */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                            <Filter size={18} className="opacity-40 mr-2 shrink-0" />
                            {[
                                { id: 'ALL', label: 'Tất cả' },
                                { id: 'IN_PROGRESS', label: 'Đang thực hiện' },
                                { id: 'COMPLETED', label: 'Đã hoàn thành' },
                                { id: 'FAILED', label: 'Thất bại' }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => {
                                        setFilter(f.id as any);
                                        setPage(0);
                                    }}
                                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${filter === f.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'bg-surface border border-border text-foreground opacity-60 hover:opacity-100 hover:bg-border/50'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* DANH SÁCH MỤC TIÊU */}
                        {goals.length === 0 ? (
                            <div className="text-center p-12 border border-dashed border-border rounded-[2.5rem] opacity-50">
                                <Target className="mx-auto mb-4 w-12 h-12" />
                                <p>Không có mục tiêu nào phù hợp với bộ lọc hiện tại.</p>
                            </div>
                        ) : (
                            <>
                                <AnimatePresence>
                                    {goals.map((goal) => {
                                        const progressPercent = Math.min((goal.currentValue / goal.targetValue) * 100, 100);

                                        const isCompleted = goal.status === 'COMPLETED';
                                        const isFailed = goal.status === 'FAILED';
                                        const isInProgress = goal.status === 'IN_PROGRESS';

                                        let barColor = 'bg-primary';
                                        if (isFailed) {
                                            barColor = 'bg-red-500';
                                        } else if (isCompleted) {
                                            barColor = 'bg-green-500';
                                        } else {
                                            if (progressPercent >= 90) barColor = 'bg-red-400';
                                            else if (progressPercent >= 70) barColor = 'bg-orange-500';
                                        }
                                        const daysLeft = goal.deadline ? calculateDaysLeft(goal.deadline) : null;

                                        return (
                                            <motion.div
                                                key={goal.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`bg-surface border ${isCompleted ? 'border-primary' : isFailed ? 'border-red-500/50 opacity-70' : 'border-border'
                                                    } rounded-[2rem] p-6 shadow-sm transition-all`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                                            {goal.goalName}
                                                            {isCompleted && <CheckCircle className="text-primary w-5 h-5" />}
                                                            {isFailed && <X className="text-red-500 w-5 h-5" />}
                                                        </h3>
                                                        <div className="text-sm opacity-60 mt-1 flex flex-wrap items-center gap-3">
                                                            <span>Đã phát thải: <span className="font-bold text-foreground">{goal.currentValue}</span> / {goal.targetValue} kg CO₂</span>

                                                            {goal.deadline && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={14} className={isFailed ? "text-red-500" : "text-orange-500"} />
                                                                    <span className={isFailed ? "text-red-500 line-through" : ""}>{goal.deadline}</span>

                                                                    {/* BADGE TRẠNG THÁI THEO DB */}
                                                                    <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-black text-white ${isFailed ? 'bg-red-500' :
                                                                        isCompleted ? 'bg-primary' :
                                                                            daysLeft === 0 ? 'bg-orange-500' : 'bg-blue-500'
                                                                        }`}>
                                                                        {isFailed ? 'Thất bại' :
                                                                            isCompleted ? 'Hoàn thành' :
                                                                                daysLeft === 0 ? 'Hạn cuối hôm nay' :
                                                                                    daysLeft !== null && daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Quá hạn'}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Chỉ hiện nút cập nhật nếu ĐANG THỰC HIỆN */}
                                                    {isInProgress && (
                                                        <button
                                                            onClick={() => setSelectedGoal(goal)}
                                                            className="p-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                                                        >
                                                            <TrendingUp size={16} /> Cập nhật
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progressPercent}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${barColor}`}
                                                    />
                                                </div>
                                                <div className="text-right mt-2 text-xs font-bold opacity-40">
                                                    {progressPercent.toFixed(1)}%
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* PAGINATION */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-8 pt-4 border-t border-border flex-wrap">

                                        {/* Nút Về Đầu */}
                                        <button
                                            onClick={() => setPage(0)}
                                            disabled={page === 0}
                                            className="px-3 py-2 bg-surface border border-border rounded-xl font-bold hover:bg-border transition disabled:opacity-30"
                                        >
                                            Đầu
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
                                                        (i >= page - range && i <= page + range)
                                                    ) {
                                                        pages.push(
                                                            <button
                                                                key={i}
                                                                onClick={() => setPage(i)}
                                                                className={`w-10 h-10 rounded-xl font-bold transition border ${page === i
                                                                        ? "bg-primary text-white border-primary"
                                                                        : "bg-surface border-border hover:bg-border"
                                                                    }`}
                                                            >
                                                                {i + 1}
                                                            </button>
                                                        );
                                                    }
                                                    // Thêm dấu ba chấm
                                                    else if (i === page - range - 1 || i === page + range + 1) {
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

                                        {/* Nút Đến Cuối */}
                                        <button
                                            onClick={() => setPage(totalPages - 1)}
                                            disabled={page >= totalPages - 1}
                                            className="px-3 py-2 bg-surface border border-border rounded-xl font-bold hover:bg-border transition disabled:opacity-30"
                                        >
                                            Cuối
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* ... (Giữ nguyên MODAL và Footer) ... */}
            <AnimatePresence>
                {selectedGoal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-xl">Cập nhật tiến độ</h3>
                                <button onClick={() => setSelectedGoal(null)} className="p-2 bg-muted rounded-full hover:bg-border transition"><X size={18} /></button>
                            </div>

                            <p className="mb-6 opacity-70">
                                Nhập số lượng kg CO₂ bạn đã tiết kiệm được thêm cho mục tiêu <strong className="text-foreground">"{selectedGoal.goalName}"</strong>.
                            </p>

                            <form onSubmit={handleUpdateProgress}>
                                <div className="mb-6">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="VD: 2.5"
                                        className="w-full p-4 text-center text-2xl font-black rounded-2xl border border-border bg-background/50 focus:border-primary/50 outline-none"
                                        value={addedValue}
                                        onChange={(e) => setAddedValue(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="text-center mt-2 text-xs opacity-50 uppercase font-bold">kg CO₂</div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="w-full py-4 bg-foreground text-background rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin" size={20} /> : "Xác nhận cập nhật"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}