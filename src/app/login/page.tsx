"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, User, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
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

export default function LoginPage() {
    const router = useRouter();
    const toast = useToast();

    /* ================= STATE ================= */
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    /* ================= MOUSE ================= */
    useEffect(() => {
        const move = (e: MouseEvent) => {
            setMouse({
                x: (e.clientX / window.innerWidth - 0.5) * 20,
                y: (e.clientY / window.innerHeight - 0.5) * 20,
            });

            setCursor({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);

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
    const handleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setProgress(0);

        simulateProgress();

        try {
            const res = await authService.login({ username, password });

            localStorage.setItem("token", res.data.token);
            toast.success(res.data.message || "Đăng nhập thành công!");

            setProgress(100);

            setTimeout(() => {
                router.push("/");
            }, 1500);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                err.response?.data ||
                "Sai tài khoản hoặc mật khẩu"
            );
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

    /* ================= TILT ================= */
    const handleMouseMove = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setTilt({
            x: -(y / rect.height - 0.5) * 6,
            y: (x / rect.width - 0.5) * 6,
        });
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[#FDFBF7] overflow-hidden">

            {/* CURSOR GLOW (Accent - 10%) */}
            <motion.div
                className="pointer-events-none fixed w-40 h-40 rounded-full bg-[#AAF0D1] opacity-30 blur-3xl"
                animate={{
                    x: cursor.x - 80,
                    y: cursor.y - 80,
                }}
                transition={{ duration: 0.08 }}
            />

            {/* BACKGROUND (60%) */}
            <div className="absolute inset-0">
                <div className="absolute w-[500px] h-[500px] bg-[#AAF0D1] rounded-full blur-3xl opacity-20 -top-20 -left-20" />
                <div className="absolute w-[400px] h-[400px] bg-[#228B22] rounded-full blur-3xl opacity-10 bottom-0 right-0" />

                {/* NOISE */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay">
                    <svg width="100%" height="100%">
                        <filter id="noise">
                            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#noise)" />
                    </svg>
                </div>
            </div>

            {/* FLOATING ICON */}
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-[#AAF0D1]"
                    style={{
                        top: `${15 + i * 18}%`,
                        left: `${8 + i * 20}%`,
                    }}
                    animate={{
                        y: [0, -12, 0],
                        x: mouse.x * (0.2 + i * 0.05),
                    }}
                    transition={{
                        duration: 6 + i,
                        repeat: Infinity,
                    }}
                >
                    <Leaf size={24 + i * 4} />
                </motion.div>
            ))}

            {/* CARD (30%) */}
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                animate={{
                    rotateX: tilt.x,
                    rotateY: tilt.y,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="
          w-full max-w-md p-8 rounded-2xl
          bg-white/80 backdrop-blur-xl
          border border-white/40
          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          z-10
        "
            >

                {/* PROGRESS */}
                {loading && (
                    <div className="mb-4 h-1 bg-gray-200 rounded">
                        <motion.div
                            className="h-full bg-[#228B22]"
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* HEADER */}
                <div className="text-center mb-6">
                    <div className="bg-[#AAF0D1]/40 p-3 rounded-full inline-block mb-2">
                        <Leaf className="text-[#228B22]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#1A3021]">
                        Đăng nhập
                    </h2>
                    <p className="text-xs text-gray-500">
                        Sống bền vững bắt đầu từ việc đo lường dấu chân carbon cá nhân
                    </p>
                </div>

                {/* FORM */}
                <motion.form
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.08 } },
                    }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                >

                    {/* USERNAME */}
                    <motion.div variants={itemAnim}>
                        <InputField
                            icon={<User size={16} />}
                            value={username}
                            onChange={(e: any) => setUsername(e.target.value)}
                            disabled={loading}
                            placeholder="Tên đăng nhập"
                        />
                    </motion.div>

                    {/* PASSWORD */}
                    <motion.div variants={itemAnim}>
                        <div className="
              flex items-center rounded-lg px-3
              border border-gray-200
              bg-white/70
              transition-all duration-200
              focus-within:border-[#228B22]
              focus-within:ring-2
              focus-within:ring-[#AAF0D1]
            ">
                            <Lock size={16} className="text-gray-400 mr-2" />

                            <input
                                type={showPwd ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                placeholder="Mật khẩu"
                                className="flex-1 py-3 outline-none bg-transparent text-sm text-[#1A3021]"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPwd(!showPwd)}
                                disabled={loading}
                                className="ml-2 text-gray-400 hover:text-[#228B22] transition"
                            >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </motion.div>

                    {/* FORGOT */}
                    <div className="text-right text-sm">
                        <Link
                            href="/forgot-password"
                            className="text-gray-500 hover:text-[#228B22] transition"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>

                    {/* BUTTON */}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.03 }}
                        disabled={loading}
                        className="
              w-full p-3 rounded-lg
              bg-[#228B22] text-white font-medium
              shadow-md hover:shadow-lg
              transition-all duration-200
              disabled:bg-gray-400
            "
                    >
                        {loading ? "Đang xử lý..." : "Đăng nhập"}
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
                <p className="mt-5 text-center text-sm text-gray-500">
                    Chưa có tài khoản?{" "}
                    <Link
                        href="/register"
                        className="text-[#228B22] hover:underline"
                    >
                        Đăng ký
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

/* INPUT */
function InputField({ icon, value, onChange, placeholder }: any) {
    return (
        <div className="
      flex items-center rounded-lg px-3
      border border-gray-200
      bg-white/70
      transition-all duration-200
      focus-within:border-[#228B22]
      focus-within:ring-2
      focus-within:ring-[#AAF0D1]
    ">
            <div className="text-gray-400 mr-2">{icon}</div>
            <input
                value={value}
                onChange={onChange}
                required
                placeholder={placeholder}
                className="w-full py-3 outline-none bg-transparent text-sm text-[#1A3021]"
            />
        </div>
    );
}