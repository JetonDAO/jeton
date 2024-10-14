import TableBackground from "@src/assets/images/table.png";
import Image from "next/image";
import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center items-center w-full h-full animate-grow-in">
      <div className="-z-40 md:scale-x-100 max-w-[70dvh] md:scale-y-100 md:scale-100 w-full md:max-w-[90dvw] xl:max-w-[90dvw] md:max-h-[70dvh] duration-500 scale-x-[1.9] scale-y-[1.75] sm:scale-y-125 relative 2xl:bottom-10 md:right-0 flex items-center justify-center">
        <Image
          draggable={false}
          priority
          className="object-fill w-full h-full rotate-90 md:rotate-0 md:max-h-[70dvh]"
          src={TableBackground}
          alt="table"
          style={{ imageRendering: "pixelated" }}
        />

        {children}
      </div>
    </div>
  );
}
