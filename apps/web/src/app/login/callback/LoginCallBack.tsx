"use client";

import {
  Aptos,
  AptosConfig,
  type EphemeralKeyPair,
  Network,
} from "@aptos-labs/ts-sdk";
import { storeKeylessAccount } from "@src/utils/keyless/keyless";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { getLocalEphemeralKeyPair } from "../../../utils/keyless/ephermeral";

export default function LoginCallBack() {
  const params = useParams<{ id_token: string }>();
  const router = useRouter();

  useEffect(() => {
    const jwt = params.id_token;
    if (jwt) {
      const payload = jwtDecode<{ nonce: string }>(jwt);
      const jwtNonce = payload.nonce;

      const ekp = getLocalEphemeralKeyPair();

      // Validate the EphemeralKeyPair
      if (!ekp || ekp.nonce !== jwtNonce || ekp.isExpired()) {
        throw new Error("Ephemeral key pair not found or expired");
      }
      initKeylessAccount(jwt, ekp);
    }
    router.replace("/");
  }, [params.id_token, router]);

  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
    </div>
  );
}
async function initKeylessAccount(
  jwt: string,
  ephemeralKeyPair: EphemeralKeyPair,
) {
  const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET })); // Configure your network here
  const keylessAccount = await aptos.deriveKeylessAccount({
    jwt,
    ephemeralKeyPair,
  });

  storeKeylessAccount(keylessAccount);
}
