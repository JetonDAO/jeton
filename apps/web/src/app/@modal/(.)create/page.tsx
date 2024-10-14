"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ChipUnits, type TableInfo } from "@jeton/ts-sdk";
import Modal from "@src/components/Modal";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, type ChangeEvent, type FormEvent, useContext, useEffect } from "react";

export const runtime = "edge";

type FormValues = Omit<TableInfo, "id">;

import { decryptCardShareZkey, shuffleEncryptDeckZkey } from "@jeton/zk-deck";
//@ts-ignore
import decryptCardShareWasm from "@jeton/zk-deck/wasm/decrypt-card-share.wasm";
//@ts-ignore
import shuffleEncryptDeckWasm from "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm";
import CheckIn from "@src/components/CheckIn";
import { Input } from "@src/components/Input";
import { JetonContext } from "@src/components/JetonContextProvider";
import useCheckIn from "@src/hooks/useCheckIn";
import type { SignAndSubmitTransaction } from "@src/types/SignAndSubmitTransaction";
import { finalAddressAndSignFunction } from "@src/utils/inAppWallet";

const INITIAL_FORM_VALUES: FormValues = {
  smallBlind: 1,
  numberOfRaises: 2,
  minPlayers: 2,
  minBuyIn: 100,
  maxBuyIn: 1000,
  maxPlayers: 9,
  waitingTimeout: 3600,
  chipUnit: ChipUnits.apt,
};

const INPUT_FIELDS = [
  { label: "Small Blind", name: "smallBlind" },
  { label: "Number of Raises", name: "numberOfRaises" },
  { label: "Minimum Players", name: "minPlayers" },
  { label: "Minimum Buy-in", name: "minBuyIn" },
  { label: "Maximum Buy-in", name: "maxBuyIn" },
];

export default function GameCreateModal() {
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_FORM_VALUES);
  const { account, signAndSubmitTransaction } = useWallet();
  const { checkIn, submitCheckIn } = useCheckIn();
  const [isCreating, setIsCreating] = useState(false);

  const { createTable } = useContext(JetonContext);
  const router = useRouter();

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
      if (!checkIn) throw new Error("Check in you must do");

      const TIMEOUT = 300; // 5 minutes
      const [finalAddress, finalSignAndSubmit] = finalAddressAndSignFunction(
        account!.address,
        signAndSubmitTransaction as SignAndSubmitTransaction,
      );

      const jeton = await createTable(
        formValues.smallBlind,
        formValues.numberOfRaises,
        formValues.minPlayers,
        formValues.minBuyIn,
        formValues.maxBuyIn,
        TIMEOUT,
        formValues.chipUnit,
        checkIn,
        finalAddress,
        finalSignAndSubmit,
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
  };

  return (
    <Modal className="animate-scaleUp max-w-md">
      {isCreating ? (
        <form onSubmit={handleSubmit}>
          <div className="text-white text-lg mb-5">Create a New Game</div>
          <div className="flex flex-col gap-3">
            {INPUT_FIELDS.map(({ label, name }) => (
              <Input
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
            className="nes-btn is-primary rounded-lg w-full py-2 px-4 mt-3"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
        </form>
      ) : (
        <CheckIn
          onSubmit={(value) =>
            submitCheckIn(value, () => {
              setIsCreating(true);
            })
          }
        />
      )}
    </Modal>
  );
}
