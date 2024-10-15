"use client";

import { useCallback, useEffect, useState } from "react";

export default function ProgressBar({ progress }: { progress: number }) {
  const [blinkingMeters, setBlinkingMeters] = useState(Array(8).fill(""));

  const calculateMeters = useCallback((progress: number) => {
    const meterCount = Math.floor((progress / 100) * 8);
    return Array(8)
      .fill(false)
      .map((_, index) => index < meterCount);
  }, []);

  useEffect(() => {
    setBlinkingMeters(calculateMeters(progress));
  }, [progress, calculateMeters]);

  return (
    <div className="flex flex-col justify-center gap-5 w-full">
      <div className="text-white text-2xl">% {progress}</div>
      <div className="loader-bar grid grid-cols-[repeat(3,10px)_repeat(10,15px_10px)_repeat(2,10px)] grid-rows-[repeat(6,10px)] w-full h-[110px]">
        <div className="block-border col-start-3 col-end-[-3] row-start-1 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-3 col-end-[-3] row-start-[-2] bg-white border border-[#8b5637]" />
        <div className="block-border col-start-1 row-start-3 row-end-5 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-[-2] row-start-3 row-end-5 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-2 row-start-2 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-[-3] row-start-2 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-2 row-start-5 bg-white border border-[#8b5637]" />
        <div className="block-border col-start-[-3] row-start-5 bg-white border border-[#8b5637]" />

        {blinkingMeters.map((meter, index) => (
          <div
            key={`${index + 1}`}
            className={`block-meter mx-1 col-start-${
              index * 2 + 4
            } col-span-3 row-start-3 row-end-5 bg-green-500 ${
              meter ? "opacity-100" : "opacity-0"
            } animate-${index >= 4 ? "blinky2" : `blinky1 delay-${index * 2}s`}`}
          />
        ))}
      </div>
    </div>
  );
}
