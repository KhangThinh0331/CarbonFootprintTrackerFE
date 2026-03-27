"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import {
    User,
    Mail,
    Target,
    Camera,
    X,
    Check,
    Loader2,
    Save,
    Lock,
    Eye,
    EyeOff
} from "lucide-react";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { userService } from "@/src/services/userService";
import { useToast } from "@/src/context/toastContext";

export default function ProfilePage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    // Profile State
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        fullName: "",
        avatarUrl: "",
        targetCo2Month: 0,
        totalPoints: 0,
    });

    const [showPass, setShowPass] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    const toggleShowPass = (field: keyof typeof showPass) => {
        setShowPass(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);

    // Status State
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Password State
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

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
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await userService.getMyProfile();
            setProfileData({
                username: res.data.username || "",
                email: res.data.email || "",
                fullName: res.data.fullName || "",
                avatarUrl: res.data.avatarUrl || "",
                targetCo2Month: res.data.targetCo2Month || 0,
                totalPoints: res.data.totalPoints || 0,
            });
        } catch (error: any) {
            toast.error("Lỗi tải thông tin hồ sơ");
        } finally {
            setLoading(false);
        }
    };

    // --- Xử lý Cắt ảnh (Cropping) ---
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result as string);
                setShowCropModal(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = async () => {
        try {
            setUploadingAvatar(true);
            const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels);
            await handleUploadToCloudinary(croppedImage);
            setShowCropModal(false);
        } catch (e) {
            toast.error("Lỗi khi xử lý ảnh");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUploadToCloudinary = async (blob: Blob) => {
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_UPLOAD_PRESET!);

        const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUD_NAME;
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                setProfileData(prev => ({ ...prev, avatarUrl: data.secure_url }));
                toast.success("Ảnh đại diện đã sẵn sàng!");
            }
        } catch (error) {
            toast.error("Không thể tải ảnh lên Cloudinary");
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            await userService.updateProfile(profileData);
            toast.success("Cập nhật hồ sơ thành công");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật");
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }
        setChangingPassword(true);
        try {
            await userService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success("Đổi mật khẩu thành công!");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi đổi mật khẩu");
        } finally {
            setChangingPassword(false);
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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-12">
                <header className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tight">Hồ sơ <span className="text-primary">Cá nhân</span></h1>
                    <p className="opacity-50 mt-2">Quản lý danh tính và mục tiêu sống xanh của bạn</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* CỘT TRÁI: AVATAR & STATS */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-surface border border-border rounded-[2.5rem] p-8 text-center shadow-sm">
                            <div className="relative w-32 h-32 mx-auto mb-6 group">
                                <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-primary/20 bg-muted">
                                    {profileData.avatarUrl ? (
                                        <img
                                            src={profileData.avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-3xl font-black bg-primary/10 text-white text-4xl ${getAvatarColor(profileData.fullName || "User")}`}>
                                            {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : "?"}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                    <Camera size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={onFileChange} />
                                </label>
                            </div>

                            <h3 className="text-xl font-bold">{profileData.fullName}</h3>
                            <p className="text-sm opacity-50 mb-6">@{profileData.username}</p>

                            <div className="flex justify-center gap-4 border-t border-border pt-6">
                                <div className="text-center">
                                    <p className="text-lg font-black text-primary">{profileData.totalPoints}</p>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Điểm xanh</p>
                                </div>
                                <div className="w-[1px] bg-border" />
                                <div className="text-center">
                                    <p className="text-lg font-black text-primary">{profileData.targetCo2Month}</p>
                                    <p className="text-[10px] uppercase font-bold opacity-40">Mục tiêu CO₂</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: FORMS */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Form Thông tin */}
                        <section className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-primary/10 rounded-xl text-primary"><User size={20} /></div>
                                <h2 className="text-lg font-bold">Thông tin cơ bản</h2>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <InputGroup label="Tên người dùng" icon={<User size={16} />}>
                                        <input
                                            className="bg-transparent w-full focus:outline-none font-medium"
                                            value={profileData.fullName}
                                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        />
                                    </InputGroup>
                                    <InputGroup label="Mục tiêu CO₂ (kg) mỗi tháng" icon={<Target size={16} />}>
                                        <input
                                            type="number"
                                            className="bg-transparent w-full focus:outline-none font-medium"
                                            value={profileData.targetCo2Month}
                                            onChange={(e) => setProfileData({ ...profileData, targetCo2Month: Number(e.target.value) })}
                                        />
                                    </InputGroup>
                                </div>
                                <InputGroup label="Email liên hệ" icon={<Mail size={16} />} disabled>
                                    <input className="bg-transparent w-full focus:outline-none opacity-50 cursor-not-allowed" value={profileData.email} disabled />
                                </InputGroup>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={updatingProfile}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                                    >
                                        {updatingProfile ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Form Bảo mật */}
                        <section className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Lock size={20} />
                                </div>
                                <h2 className="text-lg font-bold">Bảo mật</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-6">
                                {/* Mật khẩu hiện tại */}
                                <InputGroup label="Mật khẩu hiện tại">
                                    <div className="flex items-center w-full">
                                        <input
                                            type={showPass.old ? "text" : "password"}
                                            className="bg-transparent w-full focus:outline-none"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => toggleShowPass("old")}
                                            className="text-foreground/30 hover:text-primary transition-colors ml-2"
                                        >
                                            {showPass.old ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </InputGroup>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Mật khẩu mới */}
                                    <InputGroup label="Mật khẩu mới">
                                        <div className="flex items-center w-full">
                                            <input
                                                type={showPass.new ? "text" : "password"}
                                                className="bg-transparent w-full focus:outline-none"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShowPass("new")}
                                                className="text-foreground/30 hover:text-primary transition-colors ml-2"
                                            >
                                                {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </InputGroup>

                                    {/* Xác nhận lại */}
                                    <InputGroup label="Xác nhận lại">
                                        <div className="flex items-center w-full">
                                            <input
                                                type={showPass.confirm ? "text" : "password"}
                                                className="bg-transparent w-full focus:outline-none"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShowPass("confirm")}
                                                className="text-foreground/30 hover:text-primary transition-colors ml-2"
                                            >
                                                {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </InputGroup>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        className="px-8 py-3 bg-foreground text-background rounded-2xl font-black hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-foreground/10"
                                    >
                                        {changingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                </div>
            </main>

            {/* MODAL CẮT ẢNH (ZOOM & PAN) */}
            <AnimatePresence>
                {showCropModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h3 className="font-black text-lg">Điều chỉnh ảnh đại diện</h3>
                                <button onClick={() => setShowCropModal(false)}><X size={20} /></button>
                            </div>
                            <div className="relative h-80 bg-black">
                                <Cropper
                                    image={imageSrc!}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                    cropShape="round"
                                    showGrid={false}
                                />
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black uppercase opacity-40">
                                        <span>Phóng to</span>
                                        <span>{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowCropModal(false)} className="flex-1 py-4 font-bold opacity-50 hover:opacity-100 transition-all">Hủy</button>
                                    <button
                                        onClick={createCroppedImage}
                                        disabled={uploadingAvatar}
                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {uploadingAvatar ? <Loader2 className="animate-spin" /> : <Check size={20} />} Xong
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}

function InputGroup({ label, icon, children, disabled = false }: any) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{label}</label>
            <div className={`flex items-center gap-3 p-4 rounded-2xl border border-border bg-background/50 focus-within:border-primary/50 transition-all ${disabled ? 'bg-muted/30' : ''}`}>
                <span className="text-primary">{icon}</span>
                {children}
            </div>
        </div>
    );
}

// HELPER: Hàm xử lý cắt ảnh từ canvas
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (err) => reject(err));
        img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg");
    });
}