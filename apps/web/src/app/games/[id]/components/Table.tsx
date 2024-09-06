"use client";

import FullPageLoading from "@jeton/ui/FullPageLoading";
import { useSelector } from "@legendapp/state/react";
import { type FC, useEffect } from "react";
import { initGame, setTableId } from "../state/actions/gameActions";
import {
  selectGamePlayers$,
  selectIsGameLoading$,
} from "../state/selectors/gameSelectors";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";

type TableComponentProps = {
  id: string;
};

export const TableComponent: FC<TableComponentProps> = ({ id }) => {
  const players = useSelector(selectGamePlayers$());
  const router = useRouter();
  const {
    connected,
    isLoading: isWalletLoading,
    signMessage,
    signAndSubmitTransaction,
    account,
  } = useWallet();

  useEffect(() => {
    if (!isWalletLoading && !connected) {
      //router.push("/");
    }
  }, [isWalletLoading, connected, router]);

  useEffect(() => {
    if (!isWalletLoading && account) {
      initGame(account.address, signMessage, signAndSubmitTransaction);
    }
    setTableId(id);
  }, [id, signMessage, signAndSubmitTransaction, isWalletLoading, account]);

  const isLoading = useSelector(selectIsGameLoading$()) || isWalletLoading;
  if (isLoading) return <FullPageLoading />;

  return (
    <div>
      <p>this is the actual game page</p>
      <p>players are: </p>
      {players?.map((p) => (
        <p key={p.id}> player id: {p.id}</p>
      ))}
    </div>
  );
};
