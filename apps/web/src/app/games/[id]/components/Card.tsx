import type { CardName } from "@src/types";
import { loadCardImage } from "@src/utils/cardLoader";
import { cn } from "@src/utils/cn";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Card({
  cardName,
  className,
}: {
  cardName: CardName;
  className?: string;
}) {
  const [cardSrc, setCardSrc] = useState<StaticImageData | null>(null);

  useEffect(() => {
    const fetchCardImage = async () => {
      try {
        const image = await loadCardImage(cardName);
        setCardSrc(image);
      } catch (error) {
        console.error(error);
        setCardSrc(null);
      }
    };

    fetchCardImage();
  }, [cardName]);

  if (!cardSrc) return null;

  return (
    <Image
      src={cardSrc}
      alt={cardName}
      className={cn("shrink-0 grow-0", className)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
