import { useState } from "react";

export default function useCheckIn() {
  const [checkIn, setCheckIn] = useState<number | undefined>(undefined);

  const submitCheckIn = (value: number, callback: () => void) => {
    setCheckIn(value);
    callback();
  };

  return { checkIn, setCheckIn, submitCheckIn };
}
