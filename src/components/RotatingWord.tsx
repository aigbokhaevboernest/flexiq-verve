import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const words = ["Save", "Transfer", "Pay", "Grow"];

export const RotatingWord = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block min-w-[4ch] align-baseline">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[i]}
          initial={{ y: 24, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -24, opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-gradient inline-block"
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};
