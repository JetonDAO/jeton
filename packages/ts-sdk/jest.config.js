/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  collectCoverage: true,
  //collectCoverageFrom: ["./src/**"]
  collectCoverageFrom: ["./src/BettingManager.ts"],
};
