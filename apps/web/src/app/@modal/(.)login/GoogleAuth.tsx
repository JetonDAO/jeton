"use client";

import { EphemeralKeyPair } from "@aptos-labs/ts-sdk";
import GoogleLogo from "@jeton/ui/GoogleLogo";
import { KeylessConfig } from "@src/config/keylessConfig";
import { useEffect, useState } from "react";
import { storeEphemeralKeyPair } from "../../../utils/keyless/ephermeral";
export default function GoogleAuth() {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ephemeralKeyPair = EphemeralKeyPair.generate();
      storeEphemeralKeyPair(ephemeralKeyPair);
      // Get the nonce associated with ephemeralKeyPair
      const nonce = ephemeralKeyPair.nonce;
      const loginUrl = KeylessConfig.getKeylessUri(nonce);
      setValue(loginUrl);
    }
  }, []); // Empty dependency array ensures this runs only once after initial render
  return (
    <div className="flex items-center justify-center h-screen w-screen px-4">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome to JetonDao</h1>
        <p className="text-lg mb-8">
          Sign in with your Google account to continue
        </p>
        <a
          href={value}
          className="flex justify-center items-center border rounded-lg px-8 py-2 hover:bg-gray-100 hover:shadow-sm active:bg-gray-50 active:scale-95 transition-all"
        >
          <GoogleLogo />
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
