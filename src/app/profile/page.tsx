// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/src/components/layout/Header";
import Footer from "@/src/components/layout/Footer";
import { userService } from "@/src/services/userService";
import { useToast } from "@/src/context/toastContext";

export default function ProfilePage() {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(true);

    // State cho Form Thông tin cá nhân
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        fullName: "",
        avatarUrl: "",
        targetCo2Month: 0,
        totalPoints: 0,
    });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // STATE MỚI: Quản lý trạng thái đang upload ảnh
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // State cho Form Đổi mật khẩu
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [changingPassword, setChangingPassword] = useState(false);

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-600', 'bg-yellow-600',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        // Tính tổng mã ASCII của các ký tự trong tên để chọn màu
        const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[charCodeSum % colors.length];
    };

    // Tải thông tin người dùng khi vào trang
    useEffect(() => {
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
                toast.error(error.response?.data?.message || "Lỗi tải thông tin");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    // HÀM MỚI: Xử lý upload ảnh lên Cloudinary
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Giới hạn dung lượng (VD: 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Vui lòng chọn ảnh có kích thước dưới 5MB");
            return;
        }

        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", file);

        const UPLOAD_PRESET = process.env.NEXT_PUBLIC_UPLOAD_PRESET;
        const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUD_NAME;

        formData.append("upload_preset", UPLOAD_PRESET!);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (data.secure_url) {
                setProfileData({ ...profileData, avatarUrl: data.secure_url });
                toast.success("Tải ảnh lên thành công!");
            } else {
                toast.error(data.error?.message || "Không thể lấy link ảnh từ Cloudinary");
            }
        } catch (error) {
            toast.error("Lỗi kết nối khi tải ảnh lên");
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    // Xử lý Cập nhật thông tin
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);

        try {
            await userService.updateProfile(profileData);
            toast.success("Cập nhật thông tin thành công!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật thông tin");
        } finally {
            setUpdatingProfile(false);
        }
    };

    // ... (Hàm handleChangePassword giữ nguyên như cũ)
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }

        setChangingPassword(true);
        try {
            const res = await userService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success(res.data);
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" }); // Reset form
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.response?.data || "Lỗi khi đổi mật khẩu");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) return <div className="text-center p-10 font-bold text-green-600">Đang tải hồ sơ...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
            <Header />

            <main className="flex-grow max-w-3xl mx-auto w-full p-6 space-y-6">
                <h1 className="text-2xl font-black text-gray-800 border-b pb-4">Hồ sơ cá nhân</h1>

                {/* KHỐI 1: THÔNG TIN CÁ NHÂN */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-green-700 mb-4">Thông tin cơ bản</h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">

                        {/* GIAO DIỆN UPLOAD ẢNH MỚI */}
                        <div className="flex items-center gap-6 mb-4">
                            <div className="shrink-0">
                                {profileData.avatarUrl ? (
                                    <img
                                        src={profileData.avatarUrl}
                                        alt="Avatar"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-green-500 shadow-sm"
                                    />
                                ) : (
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-white shadow-md text-white text-2xl font-bold ${getAvatarColor(profileData.fullName || "User")}`}>
                                        {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh đại diện</label>
                                {/* Nút bấm để kích hoạt thẻ input ẩn bên dưới */}
                                <label
                                    htmlFor="avatar-upload"
                                    className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg border transition ${uploadingAvatar ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-green-600 border-green-600 hover:bg-green-50"
                                        }`}
                                >
                                    {uploadingAvatar ? "Đang tải lên..." : "Tải ảnh lên"}
                                </label>
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/png, image/jpeg, image/webp"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                />
                                <p className="text-xs text-gray-400 mt-2">Định dạng JPG, PNG, WEBP. Tối đa 5MB.</p>
                            </div>
                        </div>

                        {/* Các input cũ giữ nguyên */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 outline-none bg-gray-50 text-gray-500"
                                    value={profileData.username}
                                    disabled
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 outline-none bg-gray-50 text-gray-500"
                                    value={profileData.email}
                                    disabled
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                            <input
                                type="text" required maxLength={100}
                                className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                                value={profileData.fullName}
                                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mục tiêu phát thải (kg CO2)</label>
                                <input
                                    type="number" step="0.1" min="0" required
                                    className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                                    value={profileData.targetCo2Month}
                                    onChange={(e) => setProfileData({ ...profileData, targetCo2Month: Number(e.target.value) })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Mức trần CO2 mong muốn trong tháng.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng điểm tích lũy</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-2 outline-none bg-gray-50 text-green-600 font-bold"
                                    value={profileData.totalPoints}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit" disabled={updatingProfile}
                                className="px-6 py-2 bg-green-600 text-white rounded font-bold shadow hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {updatingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Đổi mật khẩu</h2>

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                            <input
                                type="password" required
                                className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-gray-500"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                            <input
                                type="password" required minLength={6}
                                className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                            <input
                                type="password" required minLength={6}
                                className="w-full border rounded p-2 outline-none focus:ring-2 focus:ring-green-500"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit" disabled={changingPassword}
                            className="px-4 py-2 bg-gray-800 text-white rounded font-bold shadow hover:bg-black disabled:bg-gray-400"
                        >
                            {changingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                        </button>
                    </form>
                </div>

            </main>
            <Footer />
        </div>
    );
}