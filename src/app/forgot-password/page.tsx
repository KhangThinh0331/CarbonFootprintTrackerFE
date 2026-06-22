"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { authService } from "@/src/services/authService";
import { useToast } from "@/src/context/toastContext";

/* ================= ANIMATION ================= */
const itemAnim: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 120 },
    },
};

export default function ForgotPasswordPage() {
    const router = useRouter();
    const toast = useToast();

    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

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

    /* ================= PROGRESS ================= */
    const simulateProgress = () => {
        let val = 0;
        const interval = setInterval(() => {
            val += 10;
            setProgress(val);
            if (val >= 90) clearInterval(interval);
        }, 120);
    };

    const handleForgotPassword = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setProgress(0);

        simulateProgress();

        try {
            const res = await authService.forgotPassword(email);
            toast.success(res.data);
            setProgress(100);

            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
            });

            setTimeout(() => {
                router.push(`/reset-password?email=${email}`);
            }, 2000);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data || "Có lỗi xảy ra");
            setProgress(0);
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

            {/* FLOATING LEAVES */}
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

                {/* HEADER */}
                <div className="text-center mb-6">
                    <div className="bg-accent/40 p-3 rounded-full inline-block mb-2">
                        <Leaf className="text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Quên mật khẩu
                    </h2>
                </div>

                {/* FORM */}
                <motion.form
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.08 } },
                    }}
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                >

                    <InputField
                        icon={<Mail size={16} />}
                        name="email"
                        placeholder="Email"
                        onChange={(e: any) => setEmail(e.target.value)}
                    />

                    {/* BUTTON */}
                    <motion.button
                        variants={itemAnim}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        disabled={loading}
                        className="w-full p-3 rounded-lg bg-primary text-white font-medium hover:brightness-110 active:scale-95 transition disabled:bg-gray-300"
                    >
                        {loading ? "Đang xử lý..." : "Tiếp tục"}
                    </motion.button>

                    {/* FOOTER */}
                    <p className="text-center text-sm text-foreground/60">
                        <Link href="/login" className="text-primary hover:underline">
                            Quay lại
                        </Link>
                    </p>
                </motion.form>
            </motion.div>
        </div>
    );
}

/* INPUT */
function InputField({ icon, name, placeholder, type = "text", onChange }: any) {
    return (
        <div className="
            flex items-center border border-border rounded-lg px-3
            focus-within:border-primary 
            focus-within:ring-2 focus-within:ring-accent
        ">
            <div className="text-foreground/40 mr-2">{icon}</div>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                onChange={onChange}
                required
                className="w-full p-3 outline-none bg-transparent text-sm text-foreground placeholder:text-foreground/40"
            />
        </div>
    );
}