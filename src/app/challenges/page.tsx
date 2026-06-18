"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy, Plus, Star,
    Loader2, Lock, X, ArrowRight, CalendarDays, CheckCircle, XCircle, Trash2, HelpCircle
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { challengeService } from "@/src/services/challengeService";
import { useToast } from "@/src/context/toastContext";

// --- 1. MỞ RỘNG INTERFACES ---
export interface Answer {
    id?: number;
    content: string;
    isCorrect: boolean;
}

export interface Question {
    id?: number;
    content: string;
    answers: Answer[];
}

export interface Challenge {
    id: number;
    title: string;
    description: string;
    points: number;
    startDate: string;
    endDate: string;
    questions?: Question[];
}

// Interface cho kết quả trả về
export interface QuizResultResponse {
    isPassed: boolean;
    score: number;
    totalQuestions: number;
    pointsEarned: number;
    details: {
        questionId: number;
        selectedAnswerId: number;
        correctAnswerId: number;
        isCorrect: boolean;
    }[];
}

export default function ChallengesPage() {
    const router = useRouter();
    const toast = useToast();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // --- 2. STATE DỮ LIỆU ---
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // --- STATE ADMIN: TẠO THỬ THÁCH ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newChallenge, setNewChallenge] = useState<Challenge>({
        id: 0, title: "", description: "", points: 0, startDate: "", endDate: "", questions: []
    });

    // --- STATE USER: LÀM QUIZ / XEM KẾT QUẢ ---
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
    const [quizMode, setQuizMode] = useState<'loading' | 'taking' | 'result'>('loading');
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({}); // questionId -> answerId
    const [quizResult, setQuizResult] = useState<QuizResultResponse | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken: any = jwtDecode(token);
                const roles: string[] = decodedToken.roles || [];
                if (roles.includes("ROLE_ADMIN") || roles.includes("ADMIN")) setIsAdmin(true);
            } catch (error) {
                console.error("Lỗi giải mã token:", error);
            }
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoggedIn(false);
            setLoading(false);
            return;
        }
        setIsLoggedIn(true);
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

    // ==========================================
    // LUỒNG NGHIỆP VỤ 1: USER THAM GIA / XEM LẠI QUIZ
    // ==========================================
    const handleOpenChallenge = async (challenge: Challenge) => {
        setActiveChallenge(challenge);
        setShowQuizModal(true);
        setQuizMode('loading');
        setUserAnswers({});
        setQuizResult(null);

        try {
            // NOTE: Bạn cần tạo hàm getQuizResult trong challengeService gọi API GET /{id}/result
            // Nếu API trả về 200 => User đã làm bài => Chuyển sang màn Result
            const res = await challengeService.getQuizResult(challenge.id);
            setQuizResult(res.data);
            setQuizMode('result');
        } catch (error: any) {
            // Nếu API trả lỗi (VD 400/404 vì chưa làm) => Chuyển sang màn Taking (Làm bài)
            // Giả định backend trả lỗi "Chưa tham gia" thì mới cho làm
            setQuizMode('taking');
        }
    };

    const handleSelectAnswer = (questionId: number, answerId: number) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answerId }));
    };

    const handleSubmitQuiz = async () => {
        if (!activeChallenge || !activeChallenge.questions) return;

        // Kiểm tra xem đã làm hết câu chưa
        const isAllAnswered = activeChallenge.questions.every(q => q.id && userAnswers[q.id]);
        if (!isAllAnswered) {
            return toast.error("Vui lòng trả lời tất cả các câu hỏi!");
        }

        setIsSubmitting(true);
        try {
            const payload = {
                challengeId: activeChallenge.id,
                answers: Object.entries(userAnswers).map(([qId, aId]) => ({
                    questionId: Number(qId),
                    selectedAnswerId: Number(aId)
                }))
            };

            // NOTE: Tạo hàm submitQuizAttempt gọi API POST để chấm điểm
            const res = await challengeService.submitQuizAttempt(payload);
            setQuizResult(res.data);
            setQuizMode('result');
            toast.success("Nộp bài thành công!");
            // Refresh list to update total points if passed
            fetchChallenges(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi nộp bài");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // LUỒNG NGHIỆP VỤ 2: ADMIN TẠO THỬ THÁCH QUIZ
    // ==========================================
    const addQuestion = () => {
        setNewChallenge(prev => ({
            ...prev,
            questions: [...(prev.questions || []), { content: "", answers: [{ content: "", isCorrect: true }, { content: "", isCorrect: false }] }]
        }));
    };

    const updateQuestionContent = (qIndex: number, content: string) => {
        const updated = [...(newChallenge.questions || [])];
        updated[qIndex].content = content;
        setNewChallenge({ ...newChallenge, questions: updated });
    };

    const removeQuestion = (qIndex: number) => {
        const updated = [...(newChallenge.questions || [])];
        updated.splice(qIndex, 1);
        setNewChallenge({ ...newChallenge, questions: updated });
    };

    const addAnswer = (qIndex: number) => {
        const updated = [...(newChallenge.questions || [])];
        updated[qIndex].answers.push({ content: "", isCorrect: false });
        setNewChallenge({ ...newChallenge, questions: updated });
    };

    const updateAnswer = (qIndex: number, aIndex: number, field: 'content' | 'isCorrect', value: any) => {
        const updated = [...(newChallenge.questions || [])];
        if (field === 'isCorrect') {
            // Reset các đáp án khác thành false (Chỉ 1 đáp án đúng)
            updated[qIndex].answers.forEach((a, idx) => a.isCorrect = (idx === aIndex));
        } else {
            updated[qIndex].answers[aIndex].content = value;
        }
        setNewChallenge({ ...newChallenge, questions: updated });
    };

    const removeAnswer = (qIndex: number, aIndex: number) => {
        const updated = [...(newChallenge.questions || [])];
        updated[qIndex].answers.splice(aIndex, 1);
        // Đảm bảo luôn có 1 đáp án đúng nếu lỡ xoá mất đáp án đúng
        if (!updated[qIndex].answers.some(a => a.isCorrect) && updated[qIndex].answers.length > 0) {
            updated[qIndex].answers[0].isCorrect = true;
        }
        setNewChallenge({ ...newChallenge, questions: updated });
    };

    const handleCreateChallenge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChallenge.title || !newChallenge.startDate || !newChallenge.endDate) {
            return toast.error("Vui lòng điền đủ thông tin cơ bản");
        }
        if (!newChallenge.questions || newChallenge.questions.length === 0) {
            return toast.error("Vui lòng thêm ít nhất 1 câu hỏi");
        }

        const [year, month, day] = newChallenge.startDate.split("-");
        const [y, m, d] = newChallenge.endDate.split("-");

        setIsCreating(true);
        try {
            await challengeService.createChallenge({
                ...newChallenge,
                startDate: `${day}/${month}/${year}`,
                endDate: `${d}/${m}/${y}`,
            });
            setShowCreateModal(false);
            setNewChallenge({ id: 0, title: "", description: "", points: 0, startDate: "", endDate: "", questions: [] });
            toast.success("Đã tạo thử thách thành công!");
            fetchChallenges(0);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo");
        } finally {
            setIsCreating(false);
        }
    };

    const GuestOverlay = ({ title, description }: { title: string, description: string }) => (
        <div className="absolute inset-0 z-20 backdrop-blur-[4px] bg-background/40 flex flex-col items-center justify-center rounded-[2rem] text-center p-6">
            <div className="p-3 bg-primary/10 rounded-2xl mb-3 text-primary">
                <Lock size={24} />
            </div>
            <h4 className="font-black text-lg">{title}</h4>
            <p className="text-sm opacity-70 mb-5 max-w-[240px] leading-relaxed">{description}</p>
            <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
                Đăng nhập ngay <ArrowRight size={16} />
            </button>
        </div>
    );

    if (loading && challenges.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
                            Thử thách <span className="text-orange-500">Kiến thức</span> <Trophy className="text-orange-500" size={36} />
                        </h1>
                        <p className="opacity-50 mt-2 text-lg">Trả lời đúng 100% để vượt qua và nhận điểm xanh.</p>
                    </div>

                    {isAdmin && (
                        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-black shadow-lg hover:scale-105 transition">
                            <Plus size={20} /> Tạo Thử thách mới
                        </button>
                    )}
                </header>

                {/* DANH SÁCH THỬ THÁCH */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                    <AnimatePresence>
                        {challenges.map((challenge, index) => (
                            <motion.div key={challenge.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                                className="bg-surface border border-border rounded-[2rem] p-6 shadow-sm hover:border-orange-500/50 transition-all flex flex-col h-full">

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl"><HelpCircle size={24} /></div>
                                    <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                                        <Star size={14} /> {challenge.points} Điểm
                                    </div>
                                </div>

                                <h3 className="text-xl font-black mb-2 line-clamp-2">{challenge.title}</h3>
                                <p className="text-sm opacity-60 mb-4 flex-grow line-clamp-3">{challenge.description}</p>
                                <div className="text-xs font-medium bg-muted/50 w-fit px-3 py-1.5 rounded-lg mb-6 flex items-center gap-2">
                                    <CalendarDays size={14} /> {challenge.startDate} - {challenge.endDate}
                                </div>

                                <button onClick={() => handleOpenChallenge(challenge)} className="mt-auto px-4 py-3 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 w-full shadow-md">
                                    Tham gia / Xem kết quả
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!isLoggedIn && <GuestOverlay title="Thử thách" description="Những thử thách thú vị luôn chào đón bạn." />}
                    <div className="h-[220px] w-full">
                    </div>
                </div>
            </main>

            {/* ========================================== */}
            {/* MODAL USER: THAM GIA HOẶC XEM LẠI QUIZ     */}
            {/* ========================================== */}
            <AnimatePresence>
                {showQuizModal && activeChallenge && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface z-10">
                                <div>
                                    <h3 className="font-black text-xl">{activeChallenge.title}</h3>
                                    {quizMode === 'taking' && <p className="text-sm text-orange-500 font-bold mt-1">Lưu ý: Chỉ được làm 1 lần. Phải đúng 100% mới qua.</p>}
                                </div>
                                <button onClick={() => setShowQuizModal(false)} className="p-2 bg-muted rounded-full hover:bg-border transition"><X size={18} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-8 bg-background/30">
                                {quizMode === 'loading' && (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
                                )}

                                {/* --- GIAO DIỆN LÀM BÀI --- */}
                                {quizMode === 'taking' && activeChallenge.questions?.map((q, qIndex) => (
                                    <div key={q.id} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                                        <h4 className="font-bold text-lg mb-4">Câu {qIndex + 1}: {q.content}</h4>
                                        <div className="space-y-3">
                                            {q.answers.map((ans) => (
                                                <label key={ans.id} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${userAnswers[q.id!] === ans.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${q.id}`}
                                                        className="w-5 h-5 accent-primary mr-3"
                                                        checked={userAnswers[q.id!] === ans.id}
                                                        onChange={() => handleSelectAnswer(q.id!, ans.id!)}
                                                    />
                                                    <span className="font-medium">{ans.content}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* --- GIAO DIỆN KẾT QUẢ --- */}
                                {quizMode === 'result' && quizResult && (
                                    <div className="space-y-6">
                                        <div className={`p-6 rounded-3xl text-center border-2 ${quizResult.isPassed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                            <h2 className={`text-3xl font-black mb-2 ${quizResult.isPassed ? 'text-green-600' : 'text-red-500'}`}>
                                                {quizResult.isPassed ? 'XUẤT SẮC!' : 'RẤT TIẾC!'}
                                            </h2>
                                            <p className="text-lg font-medium opacity-80 mb-2">
                                                Bạn đã đúng <span className="font-black text-2xl">{quizResult.score}/{quizResult.totalQuestions}</span> câu.
                                            </p>
                                            {quizResult.isPassed && (
                                                <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-bold">
                                                    <Star size={18} /> +{quizResult.pointsEarned} Điểm xanh
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-black opacity-50 uppercase tracking-widest text-sm ml-2">Chi tiết bài làm</h3>
                                            {activeChallenge.questions?.map((q, qIndex) => {
                                                const resDetail = quizResult.details.find(d => d.questionId === q.id);
                                                return (
                                                    <div key={q.id} className={`p-5 rounded-2xl border ${resDetail?.isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                                                        <div className="flex items-start gap-3">
                                                            <div className="mt-1">
                                                                {resDetail?.isCorrect ? <CheckCircle className="text-green-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-bold mb-3">Câu {qIndex + 1}: {q.content}</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    {q.answers.map(ans => {
                                                                        const isSelected = resDetail?.selectedAnswerId === ans.id;
                                                                        const isCorrectAns = resDetail?.correctAnswerId === ans.id;

                                                                        let baseClass = "p-3 rounded-lg border";
                                                                        if (isCorrectAns) baseClass += " border-green-500 bg-green-500/10 font-bold text-green-700"; // Hiện đáp án đúng
                                                                        else if (isSelected && !isCorrectAns) baseClass += " border-red-500 bg-red-500/10 font-bold text-red-600"; // Hiện câu chọn sai
                                                                        else baseClass += " border-transparent opacity-50";

                                                                        return (
                                                                            <div key={ans.id} className={baseClass}>
                                                                                {ans.content}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {quizMode === 'taking' && (
                                <div className="p-6 border-t border-border bg-surface sticky bottom-0">
                                    <button onClick={handleSubmitQuiz} disabled={isSubmitting}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg flex justify-center items-center gap-2 hover:brightness-110 disabled:opacity-50 transition">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Nộp bài ngay"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ========================================== */}
            {/* MODAL ADMIN: TẠO THỬ THÁCH (ĐÃ NÂNG CẤP)     */}
            {/* ========================================== */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-surface w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                            <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-surface z-10">
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <Trophy className="text-orange-500" /> Tạo Thử Thách Quiz
                                </h3>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 bg-muted rounded-full hover:bg-border transition"><X size={18} /></button>
                            </div>

                            <div className="p-8 overflow-y-auto bg-background/30">
                                <form id="challengeForm" onSubmit={handleCreateChallenge} className="space-y-8">

                                    {/* THÔNG TIN CHUNG */}
                                    <div className="space-y-4 bg-surface p-6 rounded-2xl border border-border">
                                        <h4 className="font-black text-sm uppercase opacity-50 tracking-widest mb-4">Thông tin chung</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold uppercase opacity-50 ml-1">ID</label>
                                                <input type="number" required min="1" className="w-full p-3 rounded-xl border border-border bg-background text-green-600 font-bold"
                                                    value={newChallenge.id} onChange={(e) => setNewChallenge({ ...newChallenge, id: Number(e.target.value) })} />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="text" required placeholder="Tên thử thách" className="w-full p-4 rounded-xl border border-border bg-background focus:border-primary outline-none font-bold"
                                                    value={newChallenge.title} onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })} />
                                            </div>
                                            <div className="col-span-2">
                                                <textarea required placeholder="Mô tả..." rows={2} className="w-full p-4 rounded-xl border border-border bg-background focus:border-primary outline-none resize-none"
                                                    value={newChallenge.description} onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Điểm thưởng</label>
                                                <input type="number" required min="1" className="w-full p-3 rounded-xl border border-border bg-background text-green-600 font-bold"
                                                    value={newChallenge.points || ""} onChange={(e) => setNewChallenge({ ...newChallenge, points: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Từ ngày</label>
                                                <input type="date" required className="w-full p-3 rounded-xl border border-border bg-background"
                                                    value={newChallenge.startDate} onChange={(e) => setNewChallenge({ ...newChallenge, startDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Đến ngày</label>
                                                <input type="date" required min={newChallenge.startDate} className="w-full p-3 rounded-xl border border-border bg-background"
                                                    value={newChallenge.endDate} onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* DANH SÁCH CÂU HỎI & ĐÁP ÁN */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-black text-sm uppercase opacity-50 tracking-widest">Bộ Câu Hỏi</h4>
                                            <button type="button" onClick={addQuestion} className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition">
                                                + Thêm câu hỏi
                                            </button>
                                        </div>

                                        {newChallenge.questions?.map((q, qIndex) => (
                                            <div key={qIndex} className="bg-surface p-5 rounded-2xl border-2 border-border relative">
                                                <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 p-1 rounded-md transition"><Trash2 size={18} /></button>

                                                <div className="mb-4 pr-8">
                                                    <label className="text-xs font-bold opacity-50 mb-1 block">Câu hỏi {qIndex + 1}</label>
                                                    <input type="text" required placeholder="Nhập nội dung câu hỏi..." className="w-full p-3 rounded-xl border border-border bg-background font-bold"
                                                        value={q.content} onChange={(e) => updateQuestionContent(qIndex, e.target.value)} />
                                                </div>

                                                <div className="space-y-2 pl-4 border-l-2 border-border/50">
                                                    {q.answers.map((ans, aIndex) => (
                                                        <div key={aIndex} className="flex items-center gap-2">
                                                            <input type="radio" name={`correct-${qIndex}`} checked={ans.isCorrect} onChange={() => updateAnswer(qIndex, aIndex, 'isCorrect', true)} className="w-4 h-4 accent-green-500 cursor-pointer" title="Đánh dấu đây là đáp án đúng" />
                                                            <input type="text" required placeholder={`Đáp án ${aIndex + 1}`} className={`flex-1 p-2 rounded-lg text-sm border ${ans.isCorrect ? 'border-green-500 bg-green-500/5' : 'border-border bg-background'}`}
                                                                value={ans.content} onChange={(e) => updateAnswer(qIndex, aIndex, 'content', e.target.value)} />
                                                            <button type="button" onClick={() => removeAnswer(qIndex, aIndex)} className="text-muted-foreground hover:text-red-500"><X size={16} /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => addAnswer(qIndex)} className="text-xs font-bold opacity-50 hover:opacity-100 transition mt-2">+ Thêm lựa chọn</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                </form>
                            </div>

                            <div className="p-6 border-t border-border bg-surface sticky bottom-0">
                                <button form="challengeForm" type="submit" disabled={isCreating}
                                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 hover:brightness-110 disabled:opacity-50 transition">
                                    {isCreating ? <Loader2 className="animate-spin" /> : "Tạo & Công Bố"}
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