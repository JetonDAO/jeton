import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useSelector } from "@legendapp/state/react";
import Modal from "@src/components/Modal";
import React from "react";
import { selectIsGameLoading$, selectProgressPercentage$ } from "../state/selectors/gameSelectors";

export default function DownloadModal() {
  const { isLoading: isWalletLoading } = useWallet();
  const percentage = useSelector(selectProgressPercentage$());

  const isLoading = useSelector(selectIsGameLoading$()) || isWalletLoading;
  if (isLoading)
    return (
      <Modal className="w-96 h-52 animate-grow-in">
        <div className="flex flex-col items-center gap-1 text-white text-center">
          {percentage ? (
            <>
              <progress
                className="nes-progress is-success duration-300 transition-all"
                value={percentage}
                max={100}
              />
              {`%${percentage}`}
            </>
          ) : (
            "Starting download assets..."
          )}
        </div>
      </Modal>
    );
}
