import type { PropsWithChildren } from "react";

export default function GameContainer({ children }: PropsWithChildren) {
  return (
    <div
      className={`flex flex-col relative items-center justify-center py-2 bg-[url("/images/pixel-wooden-pattern.png")] bg-repeat bg-center bg-[length:120px_120px] overflow-hidden h-[100dvh] w-[100dvw] z-50 min-h-screen`}
    >
      <div className="h-full max-w-[2000px] mx-auto w-full relative">{children}</div>
    </div>
  );
}
