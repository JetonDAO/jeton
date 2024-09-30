import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { PlacingBettingActions } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import { useEffect, useMemo, useState } from "react";
import { placeBet } from "../state/actions/gameActions";
import {
  selectAvailableActions$,
  selectAwaitingBetFrom$,
  selectGamePlayers$,
} from "../state/selectors/gameSelectors";

export default function PlayerActions() {
  const availableActions = useSelector(selectAvailableActions$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const players = useSelector(selectGamePlayers$());
  const [queuedAction, setQueuedAction] = useState<string | null>(null);
  const [isActionQueued, setIsActionQueued] = useState(false);
  const { account } = useWallet();
  const mainPlayer = useMemo(
    () => players?.find((player) => player.id === account?.address),
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
      handlePlayerAction(queuedAction);
      setQueuedAction(null);
      setIsActionQueued(false);
    }
  }, [isPlayerTurn, queuedAction]);

  const handlePlayerAction = (action: string) => {
    if (isPlayerTurn) {
      console.log(`Executing action: ${action}`);
      takePlayerAction(action);
    } else {
      console.log(`Queued action: ${action}`);
      setQueuedAction(action);
      setIsActionQueued(true);
    }
  };

  const takePlayerAction = (action: string) => {
    console.log(`Action taken: ${action}`);
  };

  return (
    <div className="fixed bottom-5 gap-5 flex justify-center w-full px-10">
      {availableActions &&
        availableActions?.length > 0 &&
        actions?.map((action) => (
          <button
            key={action}
            onClickCapture={() => {}}
            className={`bg-[#b87d5b] focus:outline-[#b87d5b] disabled:opacity-30 w-full py-4 text-lg text-white hover:brightness-90 ${
              isActionQueued && queuedAction === action ? "bg-opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => placeBet(action)}
            disabled={isActionQueued || !availableActions?.includes(action)}
          >
            {isActionQueued && queuedAction === action ? `${action} (Queued)` : action}
          </button>
        ))}
    </div>
  );
}
