/** @type {import('ts-jest').JestConfigWithTsJest} **/
import { pathsToModuleNameMapper } from "ts-jest";
import tsConfig from "./tsconfig.json" with { type: "json" };
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  collectCoverage: true,
  //collectCoverageFrom: ["./src/**"]
  collectCoverageFrom: ["./src/BettingManager.ts"],
};
