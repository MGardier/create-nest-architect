import { TEMPLATE_PATH } from "../../constants/constant";

/**
 * What a CommonJS project has that an ESM one does not
 *
 * Everything absent from this file is identical in both module
 * systems: tsconfig.build.json, nest-cli.json, oxlint.json,
 * .prettierrc and the production dependencies.
 */

// =============================================================================
//                            THE KEYS TOUCHED
// =============================================================================

/** The keys of package.json the conversion edits, as dotted paths for FsUtil. */
export const PACKAGE_JSON_PATH = {

  /** `"type": "module"` is what makes Node read the project as ESM. */
  moduleType: "type",

  scripts: "scripts",
  devDependencies: "devDependencies",
} as const;

/** The keys of tsconfig.json the conversion edits, as dotted paths for FsUtil. */
export const TSCONFIG_PATH = {

  /** Where the test runner declares its globals — describe, it, expect. */
  types: "compilerOptions.types",
} as const;

// =============================================================================
//                              JEST 
// =============================================================================

/** The five test scripts, Jest flavour. */
export const JEST_TEST_SCRIPTS: Record<string, string> = {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug":
    "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json",
};

/** What Jest needs to transpile the sources and resolve the path aliases. */
export const JEST_DEV_DEPENDENCIES: Record<string, string> = {
  "@types/jest": "^30.0.0",
  "jest": "^30.0.0",
  "ts-jest": "^29.2.5",
  "ts-loader": "^9.5.2",
  "ts-node": "^10.9.2",
  "tsconfig-paths": "^4.2.0",
};

/** The globals the test files rely on, Jest flavour. */
export const JEST_TSCONFIG_TYPES = ["node", "jest"];

/** The Jest configuration, one entry per file written. */
export const JEST_CONFIG_FILES: { template: string; target: string }[] = [
  { template: TEMPLATE_PATH.module.cjs.jestConfig, target: "jest.config.ts" },
  { template: TEMPLATE_PATH.module.cjs.jestE2e, target: "test/jest-e2e.json" },
];

// =============================================================================
//                              VITEST LEAVES
// =============================================================================

/** Vitest and its own plugins, uninstalled  with the CJS setup. */
export const VITEST_DEV_DEPENDENCIES = [
  "@vitest/coverage-v8",
  "vite-tsconfig-paths",
  "vitest",
];

/** Vitest's configuration to remove with CJS setup */
export const VITEST_CONFIG_FILES = [
  "vitest.config.ts",
  "vitest.config.e2e.ts",
];
