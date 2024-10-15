import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { PlacingBettingActions } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import { JetonContext } from "@src/components/JetonContextProvider";
import { CARDS_MAP } from "@src/lib/constants/cards";
import { mockMyCards } from "@src/lib/constants/mocks";
import { finalAddress } from "@src/utils/inAppWallet";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  selectAvailableActions$,
  selectAwaitingBetFrom$,
  selectGamePlayers$,
  selectMyCards$,
} from "../state/selectors/gameSelectors";
import Card from "./Card";

export default function PlayerActions() {
  const availableActions = useSelector(selectAvailableActions$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const { game } = useContext(JetonContext);
  const players = useSelector(selectGamePlayers$());
  const myCards = useSelector(selectMyCards$());

  const [queuedAction, setQueuedAction] = useState<PlacingBettingActions | null>(null);
  const [isActionQueued, setIsActionQueued] = useState(false);
  const { account } = useWallet();
  const [address, setInAppAddress] = useState<string>();
  const mainPlayer = useMemo(() => {
    return players?.find((player) => player?.id === address);
  }, [players, address]);
  const isPlayerTurn = awaitingBetFrom?.id === mainPlayer?.id;
  const actions: PlacingBettingActions[] = [
    PlacingBettingActions.FOLD,
    PlacingBettingActions.CHECK_CALL,
    PlacingBettingActions.RAISE,
  ];

  useEffect(() => {
    setInAppAddress(finalAddress(account?.address || ""));
  }, [account]);

  useEffect(() => {
    if (isPlayerTurn && queuedAction) {
      console.log(`Player turn, executing queued action: ${queuedAction}`);
      handlePlayerAction(queuedAction);
      clearQueue();
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
  };

  return (
    <div className="fixed bottom-5 gap-5 left-5 right-5 flex justify-center max-w-[1000px] mx-auto">
      {availableActions &&
        availableActions.length > 0 &&
        actions.map((action) => (
          <button
            key={action}
            className={`capitalize text-center focus:outline-[#b87d5b] z-20 relative nes-btn is-warning disabled:hover:cursor-not-allowed w-full py-2 sm:py-4 text-[10px] sm:text-base text-white flex hover:brightness-90 ${
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
      <div className="justify-center flex absolute shrink-0 -translate-x-4 sm:translate-x-0 -top-20 -right-5 sm:-top-28 sm:right-44 z-10">
        {myCards?.map(
          (cardName, i) =>
            CARDS_MAP[cardName] && (
              <Card
                className={`
                    w-20 sm:w-32 z-50 relative
                    ${
                      i === 0
                        ? "animate-dealAndRotate1"
                        : "animate-dealAndRotate2 right-4 sm:right-14"
                    }
                  `}
                key={cardName}
                cardName={CARDS_MAP[cardName]}
              />
            ),
        )}
      </div>
    </div>
  );
}
