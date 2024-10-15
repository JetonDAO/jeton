import { GameStatus } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import { motion } from "framer-motion";
import {
  selectAwaitingBetFrom$,
  selectGameStatus$,
  selectMyCards$,
  selectShufflingPlayer$,
} from "../state/selectors/gameSelectors";
import LogsButton from "./LogsSidebar";

export default function GameStatusBox() {
  const gameStatus = useSelector(selectGameStatus$());
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const myCards = useSelector(selectMyCards$());

  let statusMessage = "Waiting for players...";

  if (shufflingPlayer?.id) {
    statusMessage = `Shuffling... ${shufflingPlayer.id.slice(2, 8)}'s turn to shuffle`;
  } else if (gameStatus === GameStatus.DrawPrivateCards) {
    statusMessage = "Dealing private cards...";
  } else if (awaitingBetFrom?.id) {
    statusMessage = `Awaiting bet from ${awaitingBetFrom.id.slice(2, 8)}`;
  } else if (gameStatus === GameStatus.BetPreFlop && myCards && myCards?.length > 0) {
    statusMessage = "Private cards dealt. Ready for Pre-Flop betting.";
  } else if (gameStatus) {
    statusMessage = `Current status: ${gameStatus}`;
  }

  return (
    <div className="flex gap-1 items-center absolute top-4 left-4 z-[420]">
      <LogsButton />
      <motion.div
        className=" bg-black bg-opacity-70 text-[10px] max-w-[50vw] sm:text-base text-white p-3 rounded-lg shadow-md"
        key={statusMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <p>{statusMessage}</p>
      </motion.div>
    </div>
  );
}
