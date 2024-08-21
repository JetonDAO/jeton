"use client";

import FullPageLoading from "@jeton/ui/FullPageLoading";
import { useSelector } from "@legendapp/state/react";
import { type FC, useEffect } from "react";
import { initGame, setTableId } from "../state/actions/gameActions";
import {
  selectGamePlayers$,
  selectIsGameLoading$,
} from "../state/selectors/gameSelectors";

type TableComponentProps = {
  id: string;
};

export const TableComponent: FC<TableComponentProps> = ({ id }) => {
  const players = useSelector(selectGamePlayers$());
  useEffect(() => {
    initGame();
    setTableId(id);
  });

  const isLoading = useSelector(selectIsGameLoading$());
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
