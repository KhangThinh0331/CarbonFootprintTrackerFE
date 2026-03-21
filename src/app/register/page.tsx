"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, User, Mail, Lock, Eye, EyeOff, IdCard } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { authService } from "@/src/services/authService";
import { useToast } from "@/src/context/toastContext";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

/* ================= ANIMATION ================= */
const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 120 },
    },
};

export default function RegisterPage() {
    const router = useRouter();
    const toast = useToast();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [showPwd, setShowPwd] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    /* ================= PARALLAX ================= */
    useEffect(() => {
        const move = (e: MouseEvent) => {
            setMouse({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

    /* ================= PASSWORD STRENGTH ================= */
    const getStrength = () => {
        const pwd = formData.password;
        let score = 0;
        if (pwd.length >= 6) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getStrength();

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    /* ================= PROGRESS ================= */
    const simulateProgress = () => {
        let val = 0;
        const interval = setInterval(() => {
            val += 10;
            setProgress(val);
            if (val >= 90) clearInterval(interval);
        }, 120);
    };

    /* ================= HANDLE ================= */
    const handleChange = (e: any) => {
        const value = e.target.value;

        setFormData({ ...formData, password: value });

        if (!passwordRegex.test(value)) {
            setPasswordError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt");
        } else {
            setPasswordError("");
        }
    };

    const handleRegister = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setProgress(0);

        simulateProgress();

        try {
            const res = await authService.register(formData);
            toast.success(res.data);
            setProgress(100);
            setSuccess(true);

            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
            });

            setTimeout(() => {
                router.push(`/verify-email?email=${formData.email}`);
            }, 2000);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data || "Có lỗi xảy ra");
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        try {
            setLoading(true);
            if (!credentialResponse.credential) {
                toast.error("Không nhận được mã xác thực từ Google");
                return;
            }
            const res = await authService.googleLogin({
                idToken: credentialResponse.credential as string,
            });
            localStorage.setItem("token", res.data.token);
            toast.success(res.data.message);
            setTimeout(() => router.push("/"), 1200);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#FDFBF7] overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0">
                <div className="absolute w-[500px] h-[500px] bg-[#AAF0D1] rounded-full blur-3xl opacity-20 -top-20 -left-20" />
                <div className="absolute w-[400px] h-[400px] bg-[#AAF0D1] rounded-full blur-3xl opacity-10 bottom-0 right-0" />
            </div>

            {/* FLOATING LEAVES */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-[#228B22]/30"
                    style={{
                        top: `${10 + i * 15}%`,
                        left: `${5 + i * 18}%`,
                    }}
                    animate={{
                        y: [0, -15, 0],
                        x: mouse.x * (0.2 + i * 0.05),
                    }}
                    transition={{
                        duration: 5 + i,
                        repeat: Infinity,
                    }}
                >
                    <Leaf size={28 + i * 4} />
                </motion.div>
            ))}

            {/* CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md p-8 rounded-2xl bg-white/80 backdrop-blur-xl border border-[#AAF0D1]/40 shadow-xl z-10"
            >

                {/* PROGRESS */}
                {loading && (
                    <div className="mb-4 h-1 bg-gray-200 rounded">
                        <motion.div className="h-full bg-[#228B22]" animate={{ width: `${progress}%` }} />
                    </div>
                )}

                {/* SUCCESS */}
                {success ? (
                    <div className="text-center py-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-[#AAF0D1]/40 p-4 rounded-full inline-block mb-4 text-[#228B22] text-2xl"
                        >
                            ✓
                        </motion.div>

                        <h2 className="text-lg font-semibold text-[#1A3021]">
                            Đăng ký thành công
                        </h2>
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="text-center mb-6">
                            <div className="bg-[#AAF0D1]/40 p-3 rounded-full inline-block mb-2">
                                <Leaf className="text-[#228B22]" />
                            </div>
                            <h2 className="text-lg font-semibold text-[#1A3021]">
                                Tạo tài khoản
                            </h2>
                            <p className="text-xs text-[#1A3021]/60">
                                Sống bền vững bắt đầu từ việc đo lường dấu chân carbon cá nhân
                            </p>
                        </div>

                        {/* FORM */}
                        <motion.form
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: { transition: { staggerChildren: 0.08 } },
                            }}
                            onSubmit={handleRegister}
                            className="space-y-4"
                        >

                            {[
                                { icon: <User size={16} />, name: "username", placeholder: "Tên đăng nhập" },
                                { icon: <IdCard size={16} />, name: "fullName", placeholder: "Họ và tên" },
                                { icon: <Mail size={16} />, name: "email", placeholder: "Email" }
                            ].map((f, i) => (
                                <motion.div key={i} variants={itemAnim}>
                                    <InputField {...f} onChange={handleChange} />
                                </motion.div>
                            ))}

                            {/* PASSWORD */}
                            <motion.div variants={itemAnim}>
                                <div className="flex items-center border border-[#AAF0D1]/50 rounded-lg px-3
                                focus-within:border-[#228B22] 
                                focus-within:ring-2 focus-within:ring-[#AAF0D1]">

                                    <Lock size={16} className="text-[#1A3021]/40 mr-2" />

                                    <input
                                        type={showPwd ? "text" : "password"}
                                        name="password"
                                        placeholder="Mật khẩu"
                                        onChange={handleChange}
                                        required
                                        className="flex-1 py-3 outline-none bg-transparent text-sm text-[#1A3021] placeholder:text-[#1A3021]/40"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(!showPwd)}
                                        className="ml-2 text-[#1A3021]/40 hover:text-[#228B22]"
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                                )}


                                {/* Strength */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-600">Mức độ bảo mật:</span>
                                            <span className={`text-xs font-bold ${strength <= 1 ? "text-red-500" :
                                                strength === 2 ? "text-yellow-600" :
                                                    strength === 3 ? "text-[#228B22]" : "text-[#1A3021]"
                                                }`}>
                                                {strength <= 1 && "Yếu"}
                                                {strength === 2 && "Trung bình"}
                                                {strength === 3 && "Khá"}
                                                {strength >= 4 && "Mạnh"}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-gray-200 rounded overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ease-in-out
                                                    ${strength <= 1
                                                        ? "bg-red-400 w-1/4"
                                                        : strength === 2
                                                            ? "bg-yellow-400 w-2/4"
                                                            : strength === 3
                                                                ? "bg-[#AAF0D1] w-3/4"
                                                                : "bg-[#228B22] w-full"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* BUTTON */}
                            <motion.button
                                variants={itemAnim}
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.02 }}
                                disabled={loading || passwordError !== ""}
                                className="w-full p-3 rounded-lg bg-[#228B22] text-white font-medium hover:brightness-110 active:scale-95 transition disabled:bg-gray-300"
                            >
                                {loading ? "Đang xử lý..." : "Đăng ký"}
                            </motion.button>

                        </motion.form>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-4 text-gray-500 font-medium">Hoặc tiếp tục với</span>
                            </div>
                        </div>

                        {/* Nút Google */}
                        <div className="relative w-full">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                whileHover={{ scale: 1.01 }}
                                className="w-full p-3.5 rounded-xl border border-gray-300 bg-white font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-3"
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                </svg>
                                <span>Đăng nhập với Google</span>
                            </motion.button>
                            <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden">
                                <GoogleLogin
                                    onSuccess={handleSuccess}
                                    onError={() => toast.error("Google login bị lỗi")}
                                    // Tùy chỉnh nút ẩn thật to để phủ kín nút custom
                                    shape="rectangular"
                                    width="1000px"
                                />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <p className="mt-5 text-center text-sm text-[#1A3021]/60">
                            Đã có tài khoản?{" "}
                            <Link href="/login" className="text-[#228B22] hover:underline">
                                Đăng nhập
                            </Link>
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}

/* INPUT */
function InputField({ icon, name, placeholder, type = "text", onChange }: any) {
    return (
        <div className="flex items-center border border-[#AAF0D1]/50 rounded-lg px-3
                    focus-within:border-[#228B22] 
                    focus-within:ring-2 focus-within:ring-[#AAF0D1]">
            <div className="text-[#1A3021]/40 mr-2">{icon}</div>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                onChange={onChange}
                required
                className="w-full p-3 outline-none bg-transparent text-sm text-[#1A3021] placeholder:text-[#1A3021]/40"
            />
        </div>
    );
}