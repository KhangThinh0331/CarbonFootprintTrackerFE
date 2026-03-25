import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function CountUp({ value }: { value: number }) {
  const springValue = useSpring(0, {
    stiffness: 100, // Độ cứng
    damping: 30,    // Độ nảy
  });

  const displayValue = useTransform(springValue, (latest) => latest.toFixed(1));

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  return <motion.span>{displayValue}</motion.span>;
}
