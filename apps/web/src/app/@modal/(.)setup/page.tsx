export const runtime = "edge";
import Modal from "@jeton/ui/Modal";
import Link from "next/link";

export default function GameSetupModal() {
  return (
    <Modal className="animate-scaleUp">
      <div className="text-white text-2xl pb-10">Choose what do you want</div>
      <div className="flex flex-col gap-5">
        <Link
          href="/create"
          className="bg-[#b87d5b] text-center py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
        >
          Create game
        </Link>
        <Link
          href="/join"
          className="bg-[#b87d5b] text-center py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
        >
          Join game
        </Link>
      </div>
    </Modal>
  );
}
