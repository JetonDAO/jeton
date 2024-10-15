import Spinner from "@src/components/Spinner";

export default function WaitingIndicator() {
  return (
    <div className="text-white text-[8px] flex sm:text-xl items-center flex-col text-center ">
      <p className="px-1 sm:px-2 py-1 relative top-10 sm:top-5 bg-black/40">
        Waiting for players :D
      </p>
      <div className="scale-[.2] sm:scale-50 relative top-3 sm:top-5">
        <Spinner />
      </div>
    </div>
  );
}
