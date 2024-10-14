import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { PlacingBettingActions } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import { JetonContext } from "@src/components/JetonContextProvider";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  selectAvailableActions$,
  selectAwaitingBetFrom$,
  selectGamePlayers$,
} from "../state/selectors/gameSelectors";

export default function PlayerActions() {
  const availableActions = useSelector(selectAvailableActions$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const { game } = useContext(JetonContext);
  const players = useSelector(selectGamePlayers$());
  const [queuedAction, setQueuedAction] = useState<PlacingBettingActions | null>(null);
  const [isActionQueued, setIsActionQueued] = useState(false);
  const { account } = useWallet();
  const mainPlayer = useMemo(
    () => players?.find((player) => player?.id === account?.address),
    [players, account],
  );
  const isPlayerTurn = awaitingBetFrom?.id === mainPlayer?.id;
  const actions: PlacingBettingActions[] = [
    PlacingBettingActions.FOLD,
    PlacingBettingActions.CHECK_CALL,
    PlacingBettingActions.RAISE,
  ];

  useEffect(() => {
    if (isPlayerTurn && queuedAction) {
      console.log(`Player turn, executing queued action: ${queuedAction}`);
      handlePlayerAction(queuedAction);
      setQueuedAction(null);
      setIsActionQueued(false);
    }
  }, [isPlayerTurn, queuedAction]);

  const handlePlayerAction = (action: PlacingBettingActions) => {
    console.log(isPlayerTurn, awaitingBetFrom, mainPlayer);

    if (isPlayerTurn) {
      console.log(`Executing action immediately: ${action}`);
      takePlayerAction(action);
    } else {
      console.log(`Queueing action: ${action}`);
      setQueuedAction(action);
      setIsActionQueued(true);
    }
  };

  const clearQueue = () => {
    setQueuedAction(null);
    setIsActionQueued(false);
  };

  const takePlayerAction = (action: PlacingBettingActions) => {
    console.log(`Action taken: ${action}`);
    if (!game) throw new Error("Must exist by now");
    game.placeBet(action);
    clearQueue();
  };

  return (
    <div className="fixed bottom-5 gap-5 left-5 right-5 flex justify-center max-w-[1000px] mx-auto">
      {availableActions &&
        availableActions.length > 0 &&
        actions.map((action) => (
          <button
            key={action}
            className={`capitalize focus:outline-[#b87d5b] nes-btn is-warning disabled:hover:cursor-not-allowed w-full py-2 sm:py-4 text-[10px] sm:text-lg text-white hover:brightness-90 ${
              isActionQueued && queuedAction === action ? "cursor-pointer" : ""
            }`}
            onClick={() => handlePlayerAction(action)}
            disabled={
              !availableActions || !availableActions.includes(action) || queuedAction === action
            }
          >
            {`${action} ${isActionQueued && queuedAction === action ? "(Queued)" : ""}`}
          </button>
        ))}
    </div>
  );
}
