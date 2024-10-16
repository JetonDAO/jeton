import { useWallet } from "@aptos-labs/wallet-adapter-react";
import CloseIcon from "@src/assets/icons/close.svg";
import { finalAddress } from "@src/utils/inAppWallet";
import Image from "next/image";
import { useState } from "react";

export default function LogsButton() {
  const { account } = useWallet();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const address = finalAddress(account?.address || "");
  const isInAppWallet = address !== account?.address;
  const logs: { link: string; description: string }[] = [];

  return (
    <div className="hidden sm:block">
      <button
        onClick={handleToggleSidebar}
        className="flex flex-col bg-black bg-opacity-70 px-3 py-3 rounded-lg gap-2 justify-between w-14 items-center cursor-pointer z-50"
      >
        <div className="w-full h-1 bg-white" />
        <div className="w-full h-1 bg-white" />
        <div className="w-full h-1 bg-white" />
      </button>

      <div
        className={`fixed top-0 left-0 py-4 h-full w-96 bg-black bg-opacity-90 text-white transition-transform duration-300 z-50 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center px-4">
          <h2 className="text-lg font-bold">Game Logs</h2>
          <button className="opacity-80 hover:scale-90 duration-300" onClick={handleToggleSidebar}>
            <Image width={36} height={36} src={CloseIcon} alt="close icon" />
          </button>
        </div>
        <div className="p-4 divide-y-2 divide-white/20">
          <p className="text-sm break-words">
            You are using {isInAppWallet ? "our in app wallet" : "your own wallet"} with the address
            of: {address}
          </p>

          {logs.map((log, index) => (
            <div key={log.description} className="py-4">
              <p className="text-sm">
                {index + 1}. {log.description}
              </p>
              {log.link && (
                <a
                  href={log.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline text-xs"
                >
                  Transaction
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
