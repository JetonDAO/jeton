export const runtime = "edge";
import Modal from "@jeton/ui/Modal";
import Link from "next/link";

export default function GameSetupModal() {
  return (
    <Modal>
      <div className="text-white text-2xl pb-10">Create new game</div>
    </Modal>
  );
}
