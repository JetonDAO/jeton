"use client";

import buttonBackground from "@src/assets/images/button.png";
import background from "@src/assets/images/main-menu-background.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoginButton from "./component/LoginButton";

export const runtime = "edge";

export default function Home() {
  const router = useRouter();

  const buttonConfig = [
    {
      id: 1,
      label: "Play",
      action: () => {
        router.push("/play");
      },
    },
    {
      id: 2,
      label: "Settings",
      action: () => {},
    },
  ];

  return (
    <>
      <Image
        className="w-full h-full object-cover absolute top-0 left-0 -z-40"
        src={background}
        alt="background"
      />
      <div className="text-center bg-orange-300 flex flex-col items-center rounded-lg px-8 py-8 bg-opacity-75">
        <h1 className="text-2xl text-orange-800 font-bold mb-4">
          Welcome to Jeton
        </h1>
        <p className="mb-8 text-orange-700">
          Best Opportunity to lose your money
        </p>
        <div className="flex flex-col gap-5 relative z-20">
          {buttonConfig.map((btn) => (
            <button
              onClick={btn.action}
              type="button"
              key={btn.id}
              style={{ backgroundImage: buttonBackground.src }}
              className="relative w-72 h-14 p-4 flex justify-center items-center hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 overflow-hidden"
            >
              <Image
                src={buttonBackground}
                alt="Button Background"
                layout="fill"
                objectFit="cover"
                className="w-full absolute left-0 top-0 -z-10"
              />
              <span className="text-white">{btn.label}</span>
            </button>
          ))}
          <LoginButton />
        </div>
      </div>
    </>
  );
}
