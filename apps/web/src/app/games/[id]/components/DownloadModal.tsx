import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import Modal from "@src/components/Modal";
import React from "react";
import { selectIsGameLoading$ } from "../state/selectors/gameSelectors";
import { useSubscribeToGameEvent } from "./useSubscribeToGameEvent";

export default function DownloadModal() {
  const { isLoading: isWalletLoading } = useWallet();
  const [{ percentage }] = useSubscribeToGameEvent(GameEventTypes.DOWNLOAD_PROGRESS) || [
    { percentage: undefined },
  ];

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
