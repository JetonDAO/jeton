import CardBackground from "@src/assets/images/cards/card-back.png";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// Helper function to wait for a specific amount of time
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FlowerAnimation = () => {
  const totalCards = 32; // Number of cards
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  // Precompute the angles for each card
  const angles = useMemo(() => {
    const step = 360 / totalCards;
    return Array.from({ length: totalCards }, (_, index) => step * index); // Each card's rotation angle
  }, []);

  // Precompute the positions for each card
  const positions = useMemo(() => {
    let left = 0;
    const margin = 0.2;
    return Array.from({ length: totalCards }, (_, index) => {
      const position = { left: left, zIndex: index };
      left += margin; // Increment left by margin for stacking
      return position;
    });
  }, []);

  // Flower animation loop with async/await
  useEffect(() => {
    const animationLoop = setInterval(() => {
      flowerAnimation();
    }, 4000); // Run the animation every 4 seconds
    return () => clearInterval(animationLoop); // Clean up on unmount
  }, []);

  // Flower animation function using async/await
  const flowerAnimation = async () => {
    await openAllCards(); // Open all cards
    await delay(1000); // Wait 1 second
    await closeAllCards(); // Close all cards
    await delay(1000); // Wait 1 second
    resetCards(); // Reset all cards
  };

  // Open all cards
  const openAllCards = async () => {
    setOpen(true);
    await delay(1000); // Wait for the opening animation to complete
    setOpened(true);
  };

  // Close all cards
  const closeAllCards = async () => {
    setOpen(false);
    await delay(300); // Wait for the closing animation to complete
    setOpened(false);
  };

  // Reset all cards
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

export default FlowerAnimation;
