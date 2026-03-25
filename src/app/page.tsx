"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { activityLogService, ActivityLogRequest } from "@/src/services/activityLogService";
import { systemDataService } from "@/src/services/systemDataService";
import { useToast } from "@/src/context/toastContext";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import OcrScanner from "@/src/components/OcrScanner";
import CountUp from "@/src/components/CountUp";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Plus,
  History,
  BarChart3,
  Leaf,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  FileText,
  ScanLine,
  Activity,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";

// Dữ liệu giả lập để hiển thị cho khách xem thử giao diện
const MOCK_CHART_DATA = [
  { name: "Thứ 2", co2: 12.5 },
  { name: "Thứ 3", co2: 8.2 },
  { name: "Thứ 4", co2: 15.0 },
  { name: "Thứ 5", co2: 5.4 },
  { name: "Thứ 6", co2: 10.8 },
  { name: "Thứ 7", co2: 14.2 },
  { name: "CN", co2: 6.7 },
];

const MOCK_LOGS = [
  { id: 1, activityName: "Di chuyển bằng xe buýt", quantity: 10, unit: "km", note: "Đi làm buổi sáng", totalCo2: 1.2 },
  { id: 2, activityName: "Sử dụng điện sinh hoạt", quantity: 5, unit: "kWh", note: "Hóa đơn ước tính", totalCo2: 2.5 },
  { id: 3, activityName: "Tái chế nhựa", quantity: 2, unit: "kg", note: "Gom chai nhựa cũ", totalCo2: -0.5 },
];

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCo2, setTotalCo2] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [factors, setFactors] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"manual" | "ocr">("manual");

  const [formData, setFormData] = useState<ActivityLogRequest>({ factorId: 0, quantity: 0, note: "" });
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState<number | "">(now.getMonth() + 1);
  const [year, setYear] = useState<number | "">(now.getFullYear());
  const years = Array.from({ length: now.getFullYear() - 2024 + 2 }, (_, i) => 2024 + i);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setChartData(MOCK_CHART_DATA);
      setLogs(MOCK_LOGS);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    fetchMyLogs(currentPage);
  }, [currentPage, month, year]);

  const fetchMyLogs = async (page: number) => {
    try {
      const res = await activityLogService.getMyLogs(page, 20, month || undefined, year || undefined);
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);

      const total = await activityLogService.getTotalCo2(month || undefined, year || undefined);
      setTotalCo2(total.data);
      const chartRes = await activityLogService.getChartData();
      setChartData(chartRes.data);
    } catch (error: any) {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (!isLoggedIn) {
      toast.error("Bạn cần đăng nhập để thực hiện tính năng này");
      return;
    }
    setIsModalOpen(true);
    if (categories.length === 0) loadCategories();
  };

  const loadCategories = async () => {
    try {
      const res = await systemDataService.getAllCategories();
      setCategories(res.data);
    } catch (error) {
      toast.error("Lỗi tải danh mục");
    }
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = Number(e.target.value);
    setSelectedCategory(catId);
    setFormData({ ...formData, factorId: 0 });
    if (catId) {
      const res = await systemDataService.getFactorsByCategory(catId);
      setFactors(res.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await activityLogService.logActivity(formData);
      setIsModalOpen(false);
      setFormData({ factorId: 0, quantity: 0, note: "" });
      fetchMyLogs(0);
      toast.success("Đã lưu hoạt động!");
    } catch (error: any) {
      toast.error("Không thể lưu nhật ký");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOcrSuccess = async (ocrData: { category: string; extractedValue: number }) => {

    const keyword = ocrData.category.toLowerCase();



    let foundFactor: any = null;

    let foundCategoryId: number | "" = "";



    // 1. Duyệt từng category để tìm factor khớp

    for (const cat of categories) {

      try {

        const res = await systemDataService.getFactorsByCategory(cat.id);

        const factorList = res.data || [];



        const matchedFactor = factorList.find((f: any) =>

          f.activityName.toLowerCase().includes(keyword) ||

          keyword.includes(f.activityName.toLowerCase())

        );



        if (matchedFactor) {

          foundFactor = matchedFactor;

          foundCategoryId = cat.id;

          setFactors(factorList);

          break;

        }

      } catch (err) {

        toast.error("Lỗi tải hệ số phát thải");

      }

    }



    // 2. Nếu không tìm thấy

    if (!foundFactor) {

      toast.error("Không tìm thấy hoạt động phù hợp từ OCR");

      return;

    }



    // 3. Set state

    setSelectedCategory(foundCategoryId);

    setFormData({

      factorId: foundFactor.id,

      quantity: ocrData.extractedValue || 0,

      note: `Quét từ AI: ${ocrData.category}`,

    });



    toast.success("AI đã nhận diện hoạt động!");

    setActiveTab("manual");

  };

  // Lớp phủ dành cho khách
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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Bảng điều khiển <span className="text-primary">Xanh</span>
            </h1>
            <p className="opacity-60 mt-1 font-medium">Theo dõi dấu chân Carbon của bạn</p>
          </div>

          <div className={`flex items-center gap-3 bg-surface p-1.5 rounded-2xl border border-border ${!isLoggedIn && 'opacity-50 pointer-events-none'}`}>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent px-4 py-2 text-sm font-bold focus:outline-none">
              <option value="">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Tháng {i + 1}</option>)}
            </select>
            <div className="w-[1px] h-4 bg-border" />
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent px-4 py-2 text-sm font-bold focus:outline-none">
              <option value="">Tất cả năm</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* TOP CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          {/* Card Total */}
          <motion.div
            whileHover={isLoggedIn ? { y: -5 } : {}}
            className="lg:col-span-4 bg-gradient-to-br from-primary to-[#059669] rounded-[2rem] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
          >
            {!isLoggedIn && <GuestOverlay title="Tổng phát thải" description="Đăng nhập để xem tổng lượng Carbon bạn đã thải ra môi trường." />}
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl"><Leaf size={24} /></div>
                <span className="text-xs font-black uppercase tracking-widest opacity-80">
                  <span className="text-xs font-black uppercase tracking-widest opacity-80">
                    Tổng chỉ số
                    {(Number(month) > 0 || Number(year) > 0) ? (
                      <>
                        {Number(month) > 0 && ` tháng ${month}`}
                        {Number(year) > 0 && ` năm ${year}`}
                      </>
                    ) : " tất cả thời gian"}
                  </span>
                </span>
              </div>
              <div className="mt-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">{isLoggedIn ? (
                    <CountUp value={totalCo2} />
                  ) : (
                    "??.?"
                  )}</span>
                  <span className="text-xl font-medium opacity-80">kg CO₂</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chart Section */}
          <div className="lg:col-span-8 bg-surface border border-border rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
            {!isLoggedIn && <GuestOverlay title="Xu hướng tuần" description="Biểu đồ phân tích phát thải theo từng ngày đang chờ bạn." />}
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-primary" />
              <h3 className="font-bold">Dữ liệu phát thải {isLoggedIn ? '7 ngày gần nhất' : '(Ví dụ)'}</h3>
            </div>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-foreground)', fontSize: 12, opacity: 0.5 }} />
                  <YAxis hide />
                  <Tooltip cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'var(--color-surface)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="co2" fill="var(--color-primary)" radius={[8, 8, 8, 8]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HISTORY TABLE */}
        <section className="bg-surface border border-border rounded-[2.5rem] overflow-hidden shadow-sm relative">
          {!isLoggedIn && <GuestOverlay title="Nhật ký chi tiết" description="Lưu lại mọi hoạt động xanh và nhận huy hiệu từ cộng đồng." />}

          <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><History size={20} /></div>
              <h3 className="font-extrabold text-lg">Hoạt động gần đây</h3>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} strokeWidth={3} /> Thêm hoạt động
            </motion.button>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-foreground/30 text-[10px] font-black uppercase tracking-widest px-4">
                    <th className="px-6 py-2">Loại hoạt động</th>
                    <th className="px-6 py-2">Chi tiết</th>
                    <th className="px-6 py-2 text-right">Lượng CO₂</th>
                  </tr>
                </thead>
                <tbody className={!isLoggedIn ? 'opacity-30' : ''}>
                  {logs.map((log) => (
                    <tr key={log.id} className="group bg-background/50 hover:bg-primary/5 transition-all">
                      <td className="px-6 py-4 rounded-l-2xl border-y border-l border-border group-hover:border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            {log.activityName.charAt(0)}
                          </div>
                          <span className="font-bold text-sm">{log.activityName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-border group-hover:border-primary/20">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium opacity-80">{log.quantity} {log.unit}</span>
                          <span className="text-[11px] opacity-40 italic">{log.note}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-border group-hover:border-primary/20">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${log.totalCo2 > 0 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                          {log.totalCo2 > 0 ? '+' : ''}{log.totalCo2.toFixed(2)} kg
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="p-6 border-t border-border flex justify-center items-center gap-8">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-sm font-bold opacity-60">
                {currentPage + 1} <span className="mx-1 opacity-30">/</span> {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-full hover:bg-primary/10 disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* MODAL (Hầu như giữ nguyên logic gốc của bạn) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-surface border border-border rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="p-6 pb-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                    <Plus size={22} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-extrabold tracking-tight">Thêm hoạt động</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors opacity-50 hover:opacity-100"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tabs Menu */}
              <div className="flex px-6 mt-4 border-b border-border">
                <button
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "manual" ? "text-primary" : "text-foreground/40 hover:text-foreground/60"
                    }`}
                  onClick={() => setActiveTab("manual")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={18} /> Nhập thủ công
                  </div>
                  {activeTab === "manual" && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </button>

                <button
                  className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === "ocr" ? "text-primary" : "text-foreground/40 hover:text-foreground/60"
                    }`}
                  onClick={() => setActiveTab("ocr")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ScanLine size={18} /> Quét AI (OCR)
                  </div>
                  {activeTab === "ocr" && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                  )}
                </button>
              </div>

              {/* Content Area */}
              <div className="overflow-y-auto custom-scrollbar">
                {activeTab === "ocr" && (
                  <div className="p-6">
                    <OcrScanner onScanSuccess={handleOcrSuccess} />
                  </div>
                )}

                {activeTab === "manual" && (
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70 ml-1">Nhóm danh mục</label>
                        <select
                          className="w-full bg-background border border-border rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                          value={selectedCategory}
                          onChange={handleCategoryChange}
                          required
                        >
                          <option value="" disabled>Chọn danh mục...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70 ml-1">Hoạt động cụ thể</label>
                        <select
                          className="w-full bg-background border border-border rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                          value={formData.factorId}
                          onChange={(e) => setFormData({ ...formData, factorId: Number(e.target.value) })}
                          disabled={!selectedCategory || factors.length === 0}
                          required
                        >
                          <option value={0} disabled>Chọn hoạt động...</option>
                          {factors.map(f => (
                            <option key={f.id} value={f.id}>{f.activityName} ({f.unit})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70 ml-1">Số lượng / Chỉ số</label>
                        <div className="relative">
                          <input
                            type="number" step="0.01" min="0" required
                            className="w-full bg-background border border-border rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pl-10"
                            placeholder="0.00"
                            value={formData.quantity || ""}
                            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                          />
                          <Activity size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold opacity-70 ml-1">Ghi chú thêm</label>
                        <input
                          type="text"
                          className="w-full bg-background border border-border rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="VD: Hóa đơn điện tháng 5..."
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-6 py-3.5 rounded-2xl font-bold bg-background border border-border hover:bg-primary/5 transition-all"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-[2] px-6 py-3.5 rounded-2xl font-bold bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                        {submitting ? "Đang lưu..." : "Lưu hoạt động"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="h-12 w-48 bg-muted animate-pulse rounded-xl" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 h-64 bg-muted animate-pulse rounded-[2rem]" />
        <div className="col-span-8 h-64 bg-muted animate-pulse rounded-[2rem]" />
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-[2.5rem]" />
    </div>
  );
}