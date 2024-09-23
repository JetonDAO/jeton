"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ChipUnits, type TableInfo, createTable } from "@jeton/ts-sdk";
import Modal from "@jeton/ui/Modal";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, type ChangeEvent, type FormEvent } from "react";

export const runtime = "edge";

type FormValues = Omit<TableInfo, "id">;

const INITIAL_FORM_VALUES: FormValues = {
  smallBlind: 0,
  numberOfRaises: 0,
  minPlayers: 2,
  maxPlayers: 10,
  minBuyIn: 100,
  maxBuyIn: 1000,
  waitingBlocks: 0,
  chipUnit: ChipUnits.apt,
};

const INPUT_FIELDS = [
  { label: "Small Blind", name: "smallBlind" },
  { label: "Number of Raises", name: "numberOfRaises" },
  { label: "Minimum Players", name: "minPlayers" },
  { label: "Maximum Players", name: "maxPlayers" },
  { label: "Minimum Buy-in", name: "minBuyIn" },
  { label: "Maximum Buy-in", name: "maxBuyIn" },
  { label: "Waiting Blocks", name: "waitingBlocks" },
];

export default function GameCreateModal() {
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const { account, signAndSubmitTransaction } = useWallet();

  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: Number.parseInt(value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const tableInfo = await createTable(
        formValues.smallBlind,
        formValues.numberOfRaises,
        formValues.minPlayers,
        formValues.maxPlayers,
        formValues.minBuyIn,
        formValues.maxBuyIn,
        formValues.waitingBlocks,
        formValues.chipUnit,
        account?.address,
        signAndSubmitTransaction,
      );

      router.push(`/games/${tableInfo.id}`);
    } finally {
      setLoading(false);
    }
  };

  // Modal choose violence and did not close on navigating
  if (!pathname.includes("create")) {
    return null;
  }

  return (
    <Modal className="animate-scaleUp">
      <form onSubmit={handleSubmit}>
        <div className="text-white text-lg mb-5">Create a New Game</div>
        <div className="flex flex-col gap-3">
          {INPUT_FIELDS.map(({ label, name }) => (
            <LabelInput
              key={name}
              label={label}
              type="number"
              value={formValues[name as keyof FormValues]}
              name={name}
              onChange={handleChange}
            />
          ))}
        </div>
        <button
          className="bg-[#b87d5b] border-2 border-[#3a3526] rounded-lg w-full py-2 px-4 text-white mt-3"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Game"}
        </button>
      </form>
    </Modal>
  );
}

interface LabelInputProps {
  label: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  name: string;
  required?: boolean;
}

function LabelInput({
  label,
  value,
  onChange,
  type = "text",
  name,
  required = true,
}: LabelInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[#eec2af]" htmlFor={name}>
        {label}:
      </label>
      <input
        className="bg-[#b87d5b] text-white border-2 border-[#3a3526] p-2"
        type={type}
        value={value}
        name={name}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
