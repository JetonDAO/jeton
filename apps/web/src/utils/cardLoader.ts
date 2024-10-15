import type { CardName } from "@src/types";
import type { StaticImageData } from "next/image";

export const loadCardImage = async (cardName: CardName): Promise<StaticImageData> => {
  try {
    const image = await import(`/src/assets/images/cards/card-${cardName}.png`);

    return image.default;
  } catch (error) {
    throw new Error(`Card image not found for card name: ${cardName}`);
  }
};
