"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { cn } from "../../../../packages/ui/libs/utils";
import CloseIcon from "../assets/icons/close.svg";

export default function Modal({
  children,
  className,
  closeButton = true,
}: {
  children: React.ReactNode;
  className?: string;
  closeButton?: boolean;
}) {
  const overlay = useRef(null);
  const wrapper = useRef(null);
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

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
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        ref={wrapper}
        className={cn(
          `absolute rounded-2xl p-10 bg-[url("/images/wood-pattern-light.png")] pt-20 bg-repeat bg-center bg-[length:200px_200px] border-8 shadow border-[#b87d5b]`,
          className,
        )}
      >
        {closeButton && (
          <button
            className="absolute right-3 top-3 opacity-80 hover:scale-90 duration-300"
            onClick={onDismiss}
          >
            <Image width={48} height={48} src={CloseIcon} alt="close icon" />
          </button>
        )}
        {children}
      </div>
    </motion.div>
  );
}
