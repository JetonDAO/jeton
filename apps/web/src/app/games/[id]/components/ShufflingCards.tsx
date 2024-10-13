import { useMemo } from "react";

const ShufflingCards = () => {
  const totalCards = 32;

  // Calculate the angles for card positions
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const angles = useMemo(() => {
    const step = 360 / totalCards;
    return Array.from({ length: totalCards }, (_, index) => step * index);
  }, [totalCards]);

  // Calculate the left positions for cards
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const positions = useMemo(() => {
    let left = 0;
    const margin = 0.2;
    return Array.from({ length: totalCards }, (_, index) => {
      const position = { left: left, zIndex: index };
      left += margin;
      return position;
    });
  }, [totalCards]);

  return (
    <div className="flex justify-center items-center absolute scale-50 translate-x-5 sm:scale-125 md:scale-150">
      {angles.map((angle, index) => (
        <div
          key={angle}
          className={`w-24 h-32 mx-2 rounded-lg bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center absolute animate-cardLoop`}
          style={{
            transformOrigin: "20% 80%",
            zIndex: positions[index]?.zIndex,
            marginLeft: `${positions[index]?.left}px`,
            marginTop: 0,
            animationDelay: `${index * 30}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default ShufflingCards;
