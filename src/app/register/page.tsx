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

    /* ================= PASSWORD ================= */
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,}$/;

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

    /* ================= HANDLE ================= */
    const handleChange = (e: any) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (name === "password") {
            if (!passwordRegex.test(value)) {
                setPasswordError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt");
            } else {
                setPasswordError("");
            }
        }
    };

    const simulateProgress = () => {
        let val = 0;
        const interval = setInterval(() => {
            val += 10;
            setProgress(val);
            if (val >= 90) clearInterval(interval);
        }, 120);
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
            toast.error(err.response?.data?.message || "Có lỗi xảy ra");
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
                idToken: credentialResponse.credential,
            });
            localStorage.setItem("token", res.data.token);
            toast.success(res.data.message);
            setTimeout(() => router.push("/"), 1200);
        } catch (err: any) {
            toast.error(err.response?.data?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0">
                <div className="absolute w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-20 -top-20 -left-20" />
                <div className="absolute w-[400px] h-[400px] bg-accent rounded-full blur-3xl opacity-10 bottom-0 right-0" />
            </div>

            {/* FLOATING ICON */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-primary/30"
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
                className="w-full max-w-md p-8 rounded-2xl bg-surface backdrop-blur-xl border border-border shadow-xl z-10"
            >

                {/* PROGRESS */}
                {loading && (
                    <div className="mb-4 h-1 bg-border rounded">
                        <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
                    </div>
                )}

                {success ? (
                    <div className="text-center py-10">
                        <div className="bg-accent/40 p-4 rounded-full inline-block mb-4 text-primary text-2xl">
                            ✓
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Đăng ký thành công
                        </h2>
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="text-center mb-6">
                            <div className="bg-accent/40 p-3 rounded-full inline-block mb-2">
                                <Leaf className="text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">
                                Tạo tài khoản
                            </h2>
                            <p className="text-xs text-foreground/60">
                                Sống bền vững bắt đầu từ việc đo lường dấu chân carbon cá nhân
                            </p>
                        </div>

                        {/* FORM */}
                        <motion.form
                            initial="hidden"
                            animate="visible"
                            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                            onSubmit={handleRegister}
                            className="space-y-4"
                        >
                            <InputField icon={<User size={16} />} name="username" placeholder="Tên đăng nhập" onChange={handleChange} />
                            <InputField icon={<IdCard size={16} />} name="fullName" placeholder="Họ và tên" onChange={handleChange} />
                            <InputField icon={<Mail size={16} />} name="email" placeholder="Email" onChange={handleChange} />

                            {/* PASSWORD */}
                            <div>
                                <div className="flex items-center border border-border rounded-lg px-3
                                focus-within:border-primary 
                                focus-within:ring-2 focus-within:ring-accent">

                                    <Lock size={16} className="text-foreground/40 mr-2" />

                                    <input
                                        type={showPwd ? "text" : "password"}
                                        name="password"
                                        placeholder="Mật khẩu"
                                        onChange={handleChange}
                                        required
                                        className="flex-1 py-3 outline-none bg-transparent text-sm text-foreground placeholder:text-foreground/40"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(!showPwd)}
                                        className="ml-2 text-foreground/40 hover:text-primary"
                                    >
                                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {passwordError && (
                                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                                )}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-medium text-gray-600">Mức độ bảo mật:</span>
                                            <span className={`text-xs font-bold ${strength <= 1 ? "text-red-500" :
                                                strength === 2 ? "text-yellow-500" :
                                                    strength === 3 ? "text-primary" :
                                                        "text-foreground"
                                                }`}>
                                            </span>
                                        </div>
                                        <div className="h-1 bg-border rounded overflow-hidden">
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
                            </div>

                            {/* BUTTON */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.02 }}
                                disabled={loading || passwordError !== ""}
                                className="w-full p-3 rounded-lg bg-primary text-white font-medium hover:brightness-110 transition disabled:bg-gray-300"
                            >
                                {loading ? "Đang xử lý..." : "Đăng ký"}
                            </motion.button>
                        </motion.form>

                        {/* GOOGLE */}
                        <div className="relative my-6">
                            <div className="border-t border-border"></div>
                            <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-3 text-xs text-foreground/60">
                                Hoặc tiếp tục với
                            </span>
                        </div>

                        <div className="relative">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                whileHover={{ scale: 1.01 }}
                                className="w-full p-3.5 rounded-lg border border-border bg-surface font-semibold text-foreground shadow-sm transition-all hover:bg-background transition flex items-center justify-center gap-3"
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                </svg>
                                <span>Đăng ký với Google</span>
                            </motion.button>

                            <div className="absolute inset-0 opacity-0">
                                <GoogleLogin onSuccess={handleSuccess} onError={() => toast.error("Google login lỗi")} />
                            </div>
                        </div>

                        {/* FOOTER */}
                        <p className="mt-5 text-center text-sm text-foreground/60">
                            Đã có tài khoản?{" "}
                            <Link href="/login" className="text-primary hover:underline">
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
function InputField({ icon, name, placeholder, onChange }: any) {
    return (
        <div className="flex items-center border border-border rounded-lg px-3
        focus-within:border-primary 
        focus-within:ring-2 focus-within:ring-accent">
            <div className="text-foreground/40 mr-2">{icon}</div>
            <input
                name={name}
                placeholder={placeholder}
                onChange={onChange}
                required
                className="w-full p-3 outline-none bg-transparent text-sm text-foreground placeholder:text-foreground/40"
            />
        </div>
    );
}