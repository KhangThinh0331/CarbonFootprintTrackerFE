"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UploadCloud, X, Loader2, Zap, CheckCircle2, ScanLine } from "lucide-react";
import { ocrService } from "@/src/services/ocrService";
import { useToast } from "@/src/context/toastContext";

interface OcrScannerProps {
    onScanSuccess?: (data: { category: string; extractedValue: number }) => void;
}

export default function OcrScanner({ onScanSuccess }: OcrScannerProps) {
    const toast = useToast();

    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate và tạo URL để xem trước ảnh
    const handleFile = (file: File) => {
        setResult(null);

        if (!file.type.startsWith("image/")) {
            toast.error("Vui lòng tải lên định dạng ảnh (JPG, PNG).");
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    // 3. Gửi API lên Spring Boot
    const handleScan = async () => {
        if (!selectedFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await ocrService.scanReceipt(formData);
            const data = res.data;
            setResult(data);
            if (onScanSuccess && data) {
                onScanSuccess({
                    category: data.category,
                    extractedValue: data.extractedValue,
                });
            }
        } catch (err: any) {
            const serverError = err.response?.data;
            const message = typeof serverError === 'string'
                ? serverError
                : (serverError?.message || "Có lỗi xảy ra khi quét hóa đơn.");
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2 text-primary">
                <Zap size={18} className="fill-primary" />
                <span className="text-sm font-bold uppercase tracking-wider">AI Recognition</span>
            </div>

            {!previewUrl ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
            relative border-2 border-dashed rounded-[2rem] p-10 text-center cursor-pointer transition-all duration-300
            ${isDragging ? "border-primary bg-primary/5 scale-[0.98]" : "border-border bg-background/50 hover:bg-primary/5"}
          `}
                >
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <UploadCloud size={32} />
                    </div>
                    <p className="font-bold text-lg">Tải lên hóa đơn</p>
                    <p className="text-sm opacity-50 mt-1">Kéo thả hoặc click để chọn ảnh (JPG, PNG)</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative rounded-[1.5rem] overflow-hidden border border-border group">
                        <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />
                        <button
                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }}
                            className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 hover:text-white p-2 rounded-xl shadow-lg transition-all text-black"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {!result ? (
                        <button
                            onClick={handleScan}
                            disabled={loading}
                            className="w-full bg-primary text-white font-extrabold py-4 rounded-2xl hover:brightness-110 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : <ScanLine size={24} />}
                            {loading ? "ĐANG PHÂN TÍCH..." : "BẮT ĐẦU QUÉT AI"}
                        </button>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-primary/5 border border-primary/20 p-5 rounded-2xl"
                        >
                            <div className="flex items-center gap-2 text-primary mb-4">
                                <CheckCircle2 size={20} />
                                <span className="font-bold">Kết quả trích xuất</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border">
                                    <span className="text-sm opacity-60">Loại hóa đơn</span>
                                    <span className="font-bold uppercase text-xs px-2 py-1 bg-primary/10 rounded-md">{result.category}</span>
                                </div>
                                <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border">
                                    <span className="text-sm opacity-60">Số liệu trích xuất</span>
                                    <span className="font-black text-lg text-primary">
                                        {result.extractedValue ? `${result.extractedValue}` : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}