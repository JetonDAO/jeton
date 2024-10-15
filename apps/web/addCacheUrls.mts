import { readFileSync, writeFileSync } from "fs";
import { decryptCardShareZkey, shuffleEncryptDeckZkey } from "@jeton/zk-deck";

const SWFile = readFileSync("./src/sw.template.js", "utf-8");

const modifiedSWFile = SWFile.replace(
  '"<urlPlaceHolder>"',
  `"${decryptCardShareZkey}", "${shuffleEncryptDeckZkey}"`,
);

writeFileSync("./public/sw.js", modifiedSWFile, "utf-8");
