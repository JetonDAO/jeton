"use client";
import { getLocalKeylessAccount } from "@src/utils/keyless/keyless";
import Link from "next/link";
import { useEffect, useState } from "react";

export const runtime = "edge";

export default function LoginButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const account = getLocalKeylessAccount();
    console.log("this is account", account);
    setLoggedIn(!!account);
  }, []);

  if (loggedIn) {
    return <div>LoggedIn</div>;
  }
  return <Link href="/login">Login here</Link>;
}
