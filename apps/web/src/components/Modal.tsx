"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { type MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { cn } from "../../../../packages/ui/libs/utils";

export default function Modal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const overlay = useRef(null);
  const wrapper = useRef(null);
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onClick: MouseEventHandler = useCallback(
    (e) => {
      if (e.target === overlay.current || e.target === wrapper.current) {
        if (onDismiss) onDismiss();
      }
    },
    [onDismiss],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  return (
    <motion.div
      ref={overlay}
      className="fixed z-50 inset-0 flex justify-center items-center animate-fadeIn"
      onClick={onClick}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={wrapper}
        className={cn(
          `absolute rounded-2xl p-10 bg-[url("/images/wood-pattern-light.png")] bg-repeat bg-center bg-[length:200px_200px] border-8 shadow border-[#b87d5b]`,
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
