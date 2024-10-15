"use client";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  aptos,
  askedInAppDialog,
  retrieveInAppAccount,
  setInAppWalletStatus,
} from "@src/utils/inAppWallet";
import { useEffect, useState } from "react";
import { Input } from "./Input";
import Modal from "./Modal";

enum ModalStates {
  CLOSED = "closed",
  WALLET = "wallet",
  FUND = "fund",
}

export default function InAppDialog() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const [modalState, setModalState] = useState<ModalStates>(ModalStates.CLOSED);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(1);

  const inAppDialogCallBack = (shouldUse: boolean) => {
    if (shouldUse) {
      setModalState(ModalStates.FUND);
    } else {
      setInAppWalletStatus(false);
      setModalState(ModalStates.CLOSED);
    }
  };

  const fundAccount = (e) => {
    e.preventDefault();

    setLoading(true);
    const [address, _] = retrieveInAppAccount();
    signAndSubmitTransaction({
      sender: account?.address,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [address, inputValue * 10 ** 8],
      },
    })
      .then((v) => {
        return aptos.waitForTransaction({
          transactionHash: v.hash,
        });
      })
      .then(() => {
        setInAppWalletStatus(true);
        setModalState(ModalStates.CLOSED);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (connected && !askedInAppDialog()) {
      setModalState(ModalStates.WALLET);
    }
  }, [connected]);

  if (modalState === ModalStates.CLOSED) return null;

  if (modalState === ModalStates.FUND) {
    return (
      <Modal className="max-w-[600px] animate-scaleUp">
        <h1 className="text-white text-lg mb-3">
          in order to use your in app wallet you need to fund it with a small amount
        </h1>
        <form onSubmit={fundAccount}>
          <Input
            value={inputValue}
            name="apt"
            label="APT"
            type="number"
            onChange={(e) => {
              e.preventDefault();
              setInputValue(Number(e.target.value));
            }}
          />
          <button className="nes-btn is-warning mt-2 w-full" type="submit" disabled={loading}>
            Fund It!
          </button>
        </form>
      </Modal>
    );
  }

  return (
    <Modal className="animate-scaleUp max-w-[600px]">
      <div className="flex flex-col">
        <h1 className="text-white text-lg mb-3">
          For better experience we recommend using our <b>in-app wallet</b> for your games.
        </h1>
        <button
          className="nes-btn is-warning mt-2 w-full"
          onClick={() => inAppDialogCallBack(true)}
        >
          Yeah, Sure!
        </button>
        <button className="nes-btn mt-2 w-full" onClick={() => inAppDialogCallBack(false)}>
          No, I'm fine
        </button>
      </div>
    </Modal>
  );
}
