import { useEffect, useMemo, useState } from "react";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ShufflingCards = () => {
  const totalCards = 32;
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  const angles = useMemo(() => {
    const step = 360 / totalCards;
    return Array.from({ length: totalCards }, (_, index) => step * index);
  }, []);

  const positions = useMemo(() => {
    let left = 0;
    const margin = 0.2;
    return Array.from({ length: totalCards }, (_, index) => {
      const position = { left: left, zIndex: index };
      left += margin;
      return position;
    });
  }, []);

  useEffect(() => {
    const animationLoop = setInterval(() => {
      flowerAnimation();
    }, 4000);
    return () => clearInterval(animationLoop);
  }, []);

  const flowerAnimation = async () => {
    setOpen(true);
    await delay(1000);
    setOpened(true);
    await closeAllCards();
    await delay(1000);
    resetCards();
  };

  const closeAllCards = async () => {
    setOpen(false);
    await delay(300);
    setOpened(false);
  };

  const resetCards = () => {
    setOpen(false);
    setOpened(false);
  };

  return (
    <div className="flex justify-center items-center absolute sm:scale-125 md:scale-150">
      {angles.map((angle, index) => (
        <div
          key={angle}
          className={`w-24 h-32 mx-2 rounded-lg bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center absolute duration-1000 transition-all ${
            opened ? "" : ""
          } ${open ? "!origin-center" : ""}`}
          style={{
            transformOrigin: "20% 80%",
            transform: open && opened ? "rotateY(180deg)" : open ? `rotate(${angle}deg)` : "",

            zIndex: positions[index]?.zIndex,
            marginLeft: `${positions[index]?.left}px`,
            marginTop: 0,
          }}
        />
      ))}
    </div>
  );
};

export default ShufflingCards;
