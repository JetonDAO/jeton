import { useSelector } from "@legendapp/state/react";
import chips from "@src/assets/images/chips/chips-3-stacks.png";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { selectPot$ } from "../state/selectors/gameSelectors";

export default function Pot() {
  const [started, setStarted] = useState(false);
  const pot = useSelector(selectPot$());
  const raisedSeats = [2, 3, 6, 8];

  return (
    <>
      <div
        className={`text-white sm:text-lg text-[10px] items-center bg-black/20 px-4 py-1 mt-2 absolute pot ${
          started ? "" : ""
        }`}
      >
        ${pot}
      </div>
      {raisedSeats.map((seat) => (
        <Image
          key={seat}
          className={`absolute duration-1000 ${
            started ? "pot animate-fading opacity-0" : `seat-${seat}  opacity-0`
          }`}
          width={32}
          height={32}
          alt="chips"
          src={chips}
        />
      ))}
    </>
  );
}
