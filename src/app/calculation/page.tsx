"use client"

import React, { useState } from 'react';
import { BookOpen, HelpCircle, Car, Zap, Utensils, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";

export default function CarbonCalculationGuide() {
    const [activeTab, setActiveTab] = useState('all');

    const categories = [
        { id: 'all', name: 'Tất cả', icon: BookOpen },
        { id: '1', name: 'Giao thông', icon: Car, source: 'DEFRA (UK) & EPA (US)' },
        { id: '2', name: 'Năng lượng', icon: Zap, source: 'Bộ Tài nguyên & Môi trường VN (MONRE)' },
        { id: '3', name: 'Ăn uống', icon: Utensils, source: 'Our World in Data & FAO (Oxford Study)' },
        { id: '4', name: 'Mua sắm', icon: ShoppingBag, source: 'DEFRA Greenhouse Gas Factors' },
    ];

    const emissionFactors = [
        { catId: '1', name: 'Xe máy (Xăng)', unit: 'km', value: 0.103 },
        { catId: '1', name: 'Xe ô tô (Xăng)', unit: 'km', value: 0.192 },
        { catId: '1', name: 'Xe buýt công cộng', unit: 'km', value: 0.089 },
        { catId: '1', name: 'Xe điện', unit: 'km', value: 0.053 },
        { catId: '1', name: 'Máy bay (Phổ thông)', unit: 'km', value: 0.150 },

        { catId: '2', name: 'Điện lưới (Việt Nam)', unit: 'kWh', value: 0.522 },
        { catId: '2', name: 'Khí Gas nấu ăn (LPG)', unit: 'kg', value: 2.983 },
        { catId: '2', name: 'Nước sạch', unit: 'm3', value: 0.344 },

        { catId: '3', name: 'Thịt bò', unit: 'kg', value: 27.0 },
        { catId: '3', name: 'Thịt lợn', unit: 'kg', value: 12.1 },
        { catId: '3', name: 'Thịt gà', unit: 'kg', value: 6.9 },
        { catId: '3', name: 'Cơm/Gạo', unit: 'kg', value: 2.7 },
        { catId: '3', name: 'Rau củ quả', unit: 'kg', value: 0.4 },

        { catId: '4', name: 'Quần áo mới (Cotton)', unit: 'item', value: 15.0 },
        { catId: '4', name: 'Giày dép', unit: 'pair', value: 12.5 },
        { catId: '4', name: 'Túi nilon', unit: 'item', value: 0.05 },
        { catId: '4', name: 'Thiết bị điện tử (Sản xuất)', unit: 'item', value: 150.0 },
    ];

    const filteredFactors = activeTab === 'all'
        ? emissionFactors
        : emissionFactors.filter(f => f.catId === activeTab);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-foreground">
                <div className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        Minh bạch số liệu phát thải
                    </h1>
                    <p className="text-muted-foreground">
                        Tìm hiểu cách ứng dụng chuyển hóa các hoạt động hằng ngày của bạn thành chỉ số Dấu chân Carbon (CO₂).
                    </p>
                </div>

                {/* Công thức tính toán */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <HelpCircle size={120} className="text-emerald-500" />
                    </div>

                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck size={22} /> Công thức cốt lõi
                    </h2>

                    <div className="bg-background/60 backdrop-blur-sm border border-border/40 p-5 rounded-2xl text-center my-4">
                        <p className="text-xs uppercase font-bold tracking-widest opacity-60 mb-1">Lượng phát thải (kg CO₂e)</p>
                        <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xl sm:text-2xl font-black">
                            <span className="text-emerald-600">Mức độ hoạt động</span>
                            <span className="opacity-40">×</span>
                            <span className="text-orange-600">Hệ số phát thải</span>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm opacity-90 mt-4 pl-2 border-l-2 border-emerald-500/30">
                        <p>
                            <strong>Mức độ hoạt động:</strong> Là dữ liệu do bạn nhập vào (Ví dụ: đi xe máy 10 km, dùng 50 kWh điện).
                        </p>
                        <p>
                            <strong>Hệ số phát thải:</strong> Lượng CO₂ sinh ra trên mỗi đơn vị hoạt động, được thẩm định bởi các tổ chức môi trường uy tín hàng đầu.
                        </p>
                    </div>
                </div>

                {/* Bảng tra cứu hệ số phát thải */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="font-black text-lg opacity-80 uppercase tracking-wide">
                            Thư viện hệ số quy đổi
                        </h3>
                        <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border/50">
                            Đơn vị tính: <strong>kg CO₂e</strong> trên một đơn vị đo lường
                        </span>
                    </div>

                    {/* Tabs điều hướng */}
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-border/40">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeTab === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${isActive
                                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>

                    {/* Hiển thị thông tin Nguồn theo danh mục đang chọn */}
                    {activeTab !== 'all' && (
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
                            <strong>Nguồn dữ liệu:</strong> {categories.find(c => c.id === activeTab)?.source}
                        </div>
                    )}

                    {/* Danh sách hệ số */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredFactors.map((factor, index) => {
                            const parentCat = categories.find(c => c.id === factor.catId);
                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-background border border-border/60 hover:border-emerald-500/30 rounded-2xl transition group"
                                >
                                    <div className="space-y-1">
                                        <p className="font-bold text-sm">{factor.name}</p>
                                        <p className="text-xs opacity-50 flex items-center gap-1">
                                            Mỗi 1 {factor.unit} {activeTab === 'all' && `• Thuộc nhóm ${parentCat?.name}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                                            {factor.value.toFixed(3)}
                                        </span>
                                        <span className="text-[10px] block opacity-50 font-bold">kg CO₂</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Nguồn Tổng Hợp */}
                <div className="bg-muted/40 border border-border/50 rounded-2xl p-5 text-xs text-muted-foreground space-y-2">
                    <p className="font-bold text-foreground opacity-80 uppercase tracking-wider">Cơ sở pháp lý & Khoa học uy tín</p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                        <li><strong>Hệ số năng lượng Việt Nam:</strong> Trích xuất từ Quyết định công bố hệ số phát thải lưới điện của Cục Biến đổi khí hậu thuộc Bộ Tài nguyên và Môi trường.</li>
                        <li><strong>Hệ số nông nghiệp & Thực phẩm:</strong> Đồng bộ dữ liệu nghiên cứu của Đại học Oxford công bố toàn cầu, hỗ trợ định lượng chính xác lượng khí thải nhà kính tích lũy trong vòng đời thực phẩm từ trang trại tới bàn ăn.</li>
                        <li><strong>Các hoạt động tiêu dùng khác:</strong> Quy chiếu từ bảng dữ liệu cập nhật mới nhất của DEFRA (UK Government Department for Environment, Food and Rural Affairs).</li>
                    </ul>
                </div>
            </div>
            <Footer />
        </div>
    );
}