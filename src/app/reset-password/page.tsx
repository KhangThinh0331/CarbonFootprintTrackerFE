"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/src/services/authService";
import { useToast } from "@/src/context/toastContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, Leaf, Lock } from "lucide-react";

/* ================= ANIMATION ================= */
const itemAnim = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 120 },
    },
};

function VerifyEmailForm() {
    const router = useRouter();
    const toast = useToast();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    /* ================= STATE ================= */
    const [otp, setOtp] = useState("");
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [loadingResend, setLoadingResend] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [warned, setWarned] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [passwordError, setPasswordError] = useState("");

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

    /* ================= COOLDOWN ================= */
    useEffect(() => {
        if (cooldown > 0) {
            const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [cooldown]);

    const getStrength = () => {
        const pwd = newPassword;
        let score = 0;
        if (pwd.length >= 6) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = getStrength();

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    const handleChange = (e: any) => {
        const value = e.target.value;
        setNewPassword(value);

        if (!passwordRegex.test(value)) {
            setPasswordError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt");
        } else {
            setPasswordError("");
        }
    };
    /* ================= ACTION ================= */
    const handleResetPassword = async (e: any) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }
        if (!email) {
            return;
        }
        setLoadingVerify(true);

        try {
            const res = await authService.resetPassword({
                email,
                otpCode: otp,
                newPassword,
            });

            toast.success(res.data);

            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                err.response?.data ||
                "Mã OTP không hợp lệ hoặc đã hết hạn"
            );
        } finally {
            setLoadingVerify(false);
        }
    };

    const handleResendForgotPasswordOtp = async () => {
        if (!email || cooldown > 0) return;

        setLoadingResend(true);
        try {
            const res = await authService.resendForgotPasswordOtp(email);
            toast.success(res.data);
            setCooldown(60);
        } catch (err: any) {
            toast.error(
                err.response?.data?.message ||
                err.response?.data ||
                "Có lỗi xảy ra"
            );
        } finally {
            setLoadingResend(false);
        }
    };

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

    if (!email) {
        return (
            <div className="text-center">
                <p className="text-red-500">Email không hợp lệ</p>
                <Link href="/register">Quay lại đăng ký</Link>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">

            {/* CURSOR GLOW */}
            <motion.div
                className="pointer-events-none fixed w-40 h-40 rounded-full bg-accent opacity-30 blur-3xl"
                animate={{
                    x: cursor.x - 80,
                    y: cursor.y - 80,
                }}
            />

            {/* BACKGROUND */}
            <div className="absolute inset-0">
                <div className="absolute w-[500px] h-[500px] bg-accent rounded-full blur-3xl opacity-20 -top-20 -left-20" />
                <div className="absolute w-[400px] h-[400px] bg-primary rounded-full blur-3xl opacity-10 bottom-0 right-0" />

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
                    className="absolute text-primary/30 dark:text-primary/20"
                    style={{
                        top: `${15 + i * 18}%`,
                        left: `${8 + i * 20}%`,
                    }}
                    animate={{
                        y: [0, -12, 0],
                        x: mouse.x * (0.2 + i * 0.05),
                    }}
                    transition={{ duration: 6 + i, repeat: Infinity }}
                >
                    <Leaf size={24 + i * 4} />
                </motion.div>
            ))}

            {/* CARD */}
            <motion.div
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}
                animate={{
                    rotateX: tilt.x,
                    rotateY: tilt.y,
                }}
                className="
        w-full max-w-md p-8 rounded-2xl
        bg-surface backdrop-blur-xl
        border border-border
        shadow-xl z-10 text-center
    "
            >

                {/* HEADER */}
                <div className="mb-6">
                    <div className="bg-accent/40 p-3 rounded-full inline-block mb-2">
                        <Leaf className="text-primary" />
                    </div>

                    <h2 className="text-lg font-semibold text-foreground">
                        Đổi mật khẩu mới
                    </h2>

                    <p className="text-sm text-foreground/60 mt-2">
                        Mã đã gửi đến email của bạn
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
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                >

                    {/* EMAIL INPUT */}
                    <motion.div variants={itemAnim}>
                        <input
                            type="email"
                            value={email || ""}
                            readOnly
                            className="
        w-full text-center text-sm
        py-3 rounded-lg
        border border-border
        bg-muted text-foreground/50
        cursor-not-allowed
    "
                        />
                    </motion.div>
                    <motion.div variants={itemAnim}>
                        <div className="
    flex items-center rounded-lg px-3
    border border-border
    bg-background
    transition-all duration-200
    focus-within:border-primary
    focus-within:ring-2
    focus-within:ring-accent
">
                            <Lock size={16} className="text-foreground/40 mr-2" />

                            <input
                                type={showPwd ? "text" : "password"}
                                value={newPassword}
                                onChange={handleChange}
                                required
                                placeholder="Mật khẩu mới"
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
                    </motion.div>
                    {newPassword && (
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
                    <motion.div variants={itemAnim}>
                        <div className="
    flex items-center rounded-lg px-3
    border border-border
    bg-background
    transition-all duration-200
    focus-within:border-primary
    focus-within:ring-2
    focus-within:ring-accent
">
                            <Lock size={16} className="text-foreground/40 mr-2" />

                            <input
                                type={showConfirmPwd ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Xác nhận mật khẩu mới"
                                className="flex-1 py-3 outline-none bg-transparent text-sm text-foreground placeholder:text-foreground/40"
                            />

                            <button
                                type="button"
                                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                                className="ml-2 text-foreground/40 hover:text-primary"
                            >
                                {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {passwordError && (
                            <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                        )}
                    </motion.div>
                    {/* OTP INPUT */}
                    <motion.div variants={itemAnim}>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/[^0-9]/g, "");

                                if (raw !== cleaned && !warned) {
                                    toast.warning("Chỉ được nhập số");
                                    setWarned(true);

                                    setTimeout(() => setWarned(false), 1500);
                                }

                                setOtp(cleaned);
                            }}
                            placeholder="••••••"
                            className="
        w-full text-center text-2xl tracking-[10px]
        py-3 rounded-lg
        border border-border
        focus:border-primary
        focus:ring-2 focus:ring-accent
        outline-none
        font-mono
        text-foreground
        bg-background
    "
                        />
                    </motion.div>

                    {/* VERIFY BUTTON */}
                    <motion.button
                        variants={itemAnim}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.03 }}
                        disabled={
                            loadingVerify ||
                            otp.length < 6 ||
                            passwordError !== "" ||
                            newPassword !== confirmPassword
                        }
                        className="
        w-full p-3 rounded-lg
        bg-primary text-white font-medium
        shadow-md hover:brightness-110
        transition
        disabled:bg-gray-400
    "
                    >
                        {loadingVerify ? "Đang kiểm tra..." : "Xác nhận"}
                    </motion.button>
                </motion.form>

                {/* RESEND */}
                <p className="mt-6 text-sm text-foreground/60">
                    Chưa nhận được mã?{" "}
                    <button
                        onClick={handleResendForgotPasswordOtp}
                        disabled={cooldown > 0 || loadingResend}
                        className="text-primary font-medium hover:underline disabled:text-gray-400"
                    >
                        {cooldown > 0
                            ? `Gửi lại (${cooldown}s)`
                            : loadingResend
                                ? "Đang gửi..."
                                : "Gửi lại"}
                    </button>
                </p>

                {/* FOOTER */}
                <p className="mt-4 text-sm text-foreground/60">
                    <Link href="/login" className="text-primary hover:underline">
                        Quay về đăng nhập
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

/* ================= PAGE ================= */
export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="text-[#228B22]">Đang tải...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}