export default function Spinner() {
  return (
    <div className="w-24 h-24">
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "0.25s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "1.75s" }}
      />
      <div className="w-8 h-8 bg-white opacity-0 block float-left" />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "0.75s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "1.25s" }}
      />
      <div
        className="w-8 h-8 bg-white opacity-0 block float-left animate-spinner transition-opacity"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}
