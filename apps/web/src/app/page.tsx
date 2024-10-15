"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation on initial load
  useEffect(() => {
    setShouldAnimate(true);
  }, []);

  return (
    <motion.div
      className="relative overflow-hidden sm:h-[100dvh] bg-black/60 w-[100dvw] z-50 flex items-center justify-center flex-col min-h-screen"
      initial={{ opacity: 0 }}
      animate={shouldAnimate ? { opacity: 1 } : {}}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className="w-full"
        initial={{ y: -50, opacity: 0 }}
        animate={shouldAnimate ? { y: 0, opacity: 1 } : {}}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <nav className="flex justify-between items-center p-5 text-white">
          <Image
            quality={50}
            width={80}
            height={80}
            className="w-14 aspect-square"
            src="/images/logo.png"
            alt="Logo"
            priority
          />
          <ul className="flex space-x-10">
            <li>
              <a href="#about" className="hover:text-gray-400 text-xs">
                Docs
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-gray-400 text-xs">
                User Manual
              </a>
            </li>
          </ul>
        </nav>
      </motion.header>

      <main className="flex-grow justify-center mb-10 px-5 text-center w-full text-white items-center flex flex-col">
        <motion.div
          className="text-5xl font-bold mb-8 leading-relaxed"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <span>Jeton</span>
          <br />
          <p className="text-2xl">Decentralized Poker Game</p>
        </motion.div>

        <motion.p
          className="text-base sm:text-xl mb-10 max-w-5xl text-balance"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Experience the thrill of a decentralized poker game, where fairness is guaranteed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link
            prefetch
            href="/games"
            className="nes-btn is-warning text-white py-3 px-8 rounded-lg text-base sm:text-xl"
          >
            Play Now
          </Link>
        </motion.div>
      </main>

      {/* Footer section */}
      <motion.footer
        className="p-5 text-white w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={shouldAnimate ? { y: 0, opacity: 1 } : {}}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="flex flex-col justify-between mx-auto text-center items-end">
          <div className="flex w-full items-center justify-center">
            <a
              href="https://x.com/JetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon twitter is-medium hover:scale-[4] duration-300" />
            </a>

            <a
              href="https://youtube.com/jetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon youtube is-medium hover:scale-[4] duration-300" />
            </a>

            <a
              href="https://github.com/jetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon github is-medium hover:scale-[4] duration-300" />
            </a>
          </div>
          <motion.div
            className="nes-balloon from-right origin-bottom-right mt-5 lg:absolute right-0 bottom-2"
            initial={{ opacity: 0 }}
            animate={shouldAnimate ? { opacity: 1 } : {}}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <p className="text-black text-xs">© 2024 Jeton. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>
    </motion.div>
  );
}
