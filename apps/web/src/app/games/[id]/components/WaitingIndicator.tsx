export default function WaitingIndicator() {
  return (
    <div className="text-white flex text-xl animate-fadeIn px-2 py-1">
      Waiting for players <div className="animate-bounce">.</div>
      <div className="animate-bounce delay-300">.</div>
      <div className="animate-bounce delay-700">.</div>
    </div>
  );
}
