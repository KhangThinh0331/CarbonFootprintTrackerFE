"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { activityLogService, ActivityLogRequest } from "@/src/services/activityLogService";
import { systemDataService } from "@/src/services/systemDataService";
// Bổ sung import Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const router = useRouter();

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

  const [formData, setFormData] = useState<ActivityLogRequest>({
    factorId: 0,
    quantity: 0,
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMyLogs(currentPage);
  }, [currentPage, router]);

  const fetchMyLogs = async (page: number) => {
    try {
      const res = await activityLogService.getMyLogs(page, 20);
      const fetchedLogs = res.data.content || [];
      setLogs(fetchedLogs);
      setTotalPages(res.data.totalPages || 0);

      const total = await activityLogService.getTotalCo2();
      setTotalCo2(total.data);
      const chartRes = await activityLogService.getChartData();
      setChartData(chartRes.data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setIsModalOpen(true);
    if (categories.length === 0) {
      try {
        const res = await systemDataService.getAllCategories();
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi tải danh mục", error);
      }
    }
  };

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = Number(e.target.value);
    setSelectedCategory(catId);
    setFormData({ ...formData, factorId: 0 });
    setFactors([]);

    if (catId) {
      try {
        const res = await systemDataService.getFactorsByCategory(catId);
        setFactors(res.data);
      } catch (error) {
        console.error("Lỗi tải hệ số phát thải", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.factorId === 0 || formData.quantity <= 0) {
      alert("Vui lòng chọn hoạt động và nhập số lượng lớn hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      await activityLogService.logActivity(formData);
      setIsModalOpen(false);
      setFormData({ factorId: 0, quantity: 0, note: "" });
      setSelectedCategory("");
      setCurrentPage(0);
      fetchMyLogs(0);
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || "Không thể lưu nhật ký"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) return <div className="p-10 text-center font-bold text-green-600">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-green-600">🌿 Carbon Tracker</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 font-semibold">Đăng xuất</button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-6">

        {/* KHU VỰC THỐNG KÊ & BIỂU ĐỒ (Chia 2 cột trên màn hình lớn) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột 1: Tổng CO2 */}
          <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center">
            <span className="text-sm text-gray-500 mb-2">Tổng CO2 phát thải</span>
            <span className="text-5xl font-black text-green-500">{totalCo2.toFixed(1)}</span>
            <span className="text-gray-400 font-medium mt-1">kg CO2</span>
          </div>

          {/* Cột 2: Biểu đồ Recharts */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm text-gray-500 mb-4 font-semibold">Phát thải 7 ngày gần nhất</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="co2" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lịch sử hoạt động */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-700">Lịch sử hoạt động</h3>
            <button
              onClick={openModal}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition font-semibold"
            >
              + Thêm nhật ký
            </button>
          </div>

          <div className="p-4">
            {logs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Chưa có dữ liệu nào ở trang này.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <li key={log.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-700">{log.activityName || "Hoạt động"}</p>
                      <p className="text-xs text-gray-400">{log.quantity} {log.unit || 'đơn vị'} • {log.note}</p>
                    </div>
                    <span className="font-bold text-red-500">+{log.totalCo2?.toFixed(2)} kg</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Khung Phân Trang */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                <button
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-4 py-2 rounded bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-semibold"
                >
                  &larr; Trang trước
                </button>
                <span className="text-sm text-gray-600 font-medium">Trang {currentPage + 1} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-4 py-2 rounded bg-white border shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm font-semibold"
                >
                  Trang sau &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL NHẬP LIỆU THỦ CÔNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
          {/* ... (Phần form HTML của Modal giữ nguyên không thay đổi) ... */}
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="bg-green-600 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Thêm hoạt động mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 font-bold text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhóm danh mục</label>
                <select
                  className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="" disabled>-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hoạt động cụ thể</label>
                <select
                  className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  value={formData.factorId}
                  onChange={(e) => setFormData({ ...formData, factorId: Number(e.target.value) })}
                  disabled={!selectedCategory || factors.length === 0}
                  required
                >
                  <option value={0} disabled>-- Chọn hoạt động --</option>
                  {factors.map(f => (
                    <option key={f.id} value={f.id}>{f.activityName} (Tính theo {f.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng / Quãng đường</label>
                <input
                  type="number" step="0.01" min="0" required
                  placeholder="VD: 15.5"
                  className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.quantity || ""}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Không bắt buộc)</label>
                <input
                  type="text" placeholder="VD: Đi làm buổi sáng" maxLength={255}
                  className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-gray-600 font-semibold hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded font-bold shadow hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting ? "Đang lưu..." : "Lưu nhật ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}