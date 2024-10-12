import { useState } from "react";
import { Input } from "./Input";

export default function CheckIn({
  onSubmit,
}: {
  onSubmit: (data: number) => void;
}) {
  const [checkIn, setCheckIn] = useState<number | undefined>();

  return (
    <div className="flex flex-col">
      <h1 className="text-white text-lg mb-3">Please enter Check-In amount to continue</h1>
      <form onSubmit={() => checkIn && onSubmit(checkIn)}>
        <Input
          placeholder="420"
          type="number"
          name="check-in"
          label="Check-In Amount"
          onChange={(e) => setCheckIn(Number(e.target.value))}
          value={checkIn}
          required
        />
        <button disabled={!checkIn} className="nes-btn is-primary mt-2 w-full" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
}
