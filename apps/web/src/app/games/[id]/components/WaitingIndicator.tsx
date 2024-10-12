export default function WaitingIndicator() {
  return (
    <div className="text-white flex text-[8px] max-w-36 sm:text-xl animate-fadeIn text-center px-2 py-1">
      Waiting for players <div className="animate-bounce hidden sm:block">.</div>
      <div className="animate-bounce  hidden sm:block delay-300">.</div>
      <div className="animate-bounce  hidden sm:block delay-700">.</div>
    </div>
  );
}
