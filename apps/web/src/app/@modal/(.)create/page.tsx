"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ChipUnits, type TableInfo } from "@jeton/ts-sdk";
import Modal from "@src/components/Modal";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, type ChangeEvent, type FormEvent, useContext } from "react";

export const runtime = "edge";

type FormValues = Omit<TableInfo, "id">;

import { decryptCardShareZkey, shuffleEncryptDeckZkey } from "@jeton/zk-deck";
//@ts-ignore
import decryptCardShareWasm from "@jeton/zk-deck/wasm/decrypt-card-share.wasm";
//@ts-ignore
import shuffleEncryptDeckWasm from "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm";
import { JetonContext } from "@src/components/JetonContextProvider";

const INITIAL_FORM_VALUES: FormValues = {
  smallBlind: 0,
  numberOfRaises: 0,
  minPlayers: 2,
  maxPlayers: 10,
  minBuyIn: 100,
  maxBuyIn: 1000,
  chipUnit: ChipUnits.apt,
};

const INPUT_FIELDS = [
  { label: "Small Blind", name: "smallBlind" },
  { label: "Number of Raises", name: "numberOfRaises" },
  { label: "Minimum Players", name: "minPlayers" },
  { label: "Maximum Players", name: "maxPlayers" },
  { label: "Minimum Buy-in", name: "minBuyIn" },
  { label: "Maximum Buy-in", name: "maxBuyIn" },
  { label: "Waiting timeOut(seconds)", name: "waitingTimeOut" },
];

export default function GameCreateModal() {
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const { account, signAndSubmitTransaction } = useWallet();

  const { createTable } = useContext(JetonContext);
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
      if (!createTable) throw new Error("create Table must exist");
      const jeton = await createTable(
        formValues.smallBlind,
        formValues.numberOfRaises,
        formValues.minPlayers,
        formValues.minBuyIn,
        formValues.maxBuyIn,
        formValues.waitingTimeOut,
        formValues.chipUnit,
        1000,
        account!.address,
        signAndSubmitTransaction,
        {
          decryptCardShareWasm,
          shuffleEncryptDeckWasm,
          decryptCardShareZkey,
          shuffleEncryptDeckZkey,
        },
      );

      router.push(`/games/${jeton.tableInfo.id}`);
    } finally {
      setLoading(false);
    }

    // Modal choose violence and did not close on navigating
    if (!pathname.includes("create")) {
      return null;
    }
  };
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
    <div className="nes-field">
      <label className="text-[#eec2af] name_field" htmlFor={name}>
        {label}:
      </label>
      <input
        className="bg-[#b87d5b] nes-input text-white p-2 accent-amber-500"
        type={type}
        value={value}
        name={name}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
