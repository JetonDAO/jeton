export const runtime = "edge";
import Modal from "@jeton/ui/Modal";
import Link from "next/link";

export default function GameSetupModal() {
  return (
    <Modal>
      <div className="text-white text-2xl pb-10">Choose what do you want</div>
      <div className="flex flex-col gap-5">
        <Link
          href="/create"
          className="bg-[#9c6249] text-center py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
        >
          Create game
        </Link>
        <Link
          href="/join"
          className="bg-[#9c6249] text-center py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
        >
          Join game
        </Link>
      </div>
    </Modal>
  );
}
