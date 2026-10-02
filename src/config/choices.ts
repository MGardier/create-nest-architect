import { AskChoiceInterface } from "../services/prompt.service";

// =============================================================================
//                              ENUMS
// =============================================================================

export enum ARCHITECTURE_TYPE {
  FEATURED = "FEATURED",
  CLEAN = "CLEAN",
}

export enum PACKAGER_TYPE {
  NPM = "NPM",
  PNPM = "PNPM",
  YARN = "YARN",
  BUN = "BUN",
}

export enum MODULE_SYSTEM {
  ESM = "ESM",
  CJS = "CJS",
}

export enum DATABASE {
  POSTGRESQL = "postgresql",
  MONGODB = "mongodb",
}

// =============================================================================
//                   DATABASE METADATA (single source of truth)
// =============================================================================

/**
 * Everything the installers need to know about a database, in one
 * place. Adding a database = one entry here + its id in the
 * supportedDatabases of the installers that handle it.
 */
/** One line of the generated .env.example. */
export interface EnvVariable {
  key: string;
  value: string;
}

export interface DatabaseMeta {
  /** Prompt display */
  label: string;

  /** Collected by finalize.step into .env.example, and read by compose.yaml. */
  envVariables: EnvVariable[];
}

export const DATABASE_META: Record<DATABASE, DatabaseMeta> = {
  [DATABASE.POSTGRESQL]: {
    label: "🐘  PostgreSQL",
    envVariables: [
      { key: "POSTGRES_USER", value: "app" },
      { key: "POSTGRES_PASSWORD", value: "app" },
      { key: "POSTGRES_DB", value: "app" },
      { key: "POSTGRES_PORT", value: "5432" },
      { key: "ADMINER_PORT", value: "8080" },
      { key: "DATABASE_URL", value: "postgresql://app:app@localhost:5432/app" },
    ],
  },
  [DATABASE.MONGODB]: {
    label: "🍃  MongoDB",
    // No compose yet: only the url the odm needs
    envVariables: [
      { key: "DATABASE_URL", value: "mongodb://user:password@localhost:27017/mydb" },
    ],
  },
};

// =============================================================================
//                CHOICES (labels colocated with their enums)
// =============================================================================

export const ARCHITECTURE_CHOICES: AskChoiceInterface<ARCHITECTURE_TYPE>[] = [
  { title: "🏷️   Featured Architecture", value: ARCHITECTURE_TYPE.FEATURED },
  { title: "🏛️   Clean Architecture", value: ARCHITECTURE_TYPE.CLEAN },
];

export const PACKAGER_CHOICES: AskChoiceInterface<PACKAGER_TYPE>[] = [
  { title: "📦   npm", value: PACKAGER_TYPE.NPM },
  { title: "⚡   pnpm", value: PACKAGER_TYPE.PNPM },
  { title: "🧶   Yarn", value: PACKAGER_TYPE.YARN },
  { title: "🍞   Bun", value: PACKAGER_TYPE.BUN },
];

export const MODULE_SYSTEM_CHOICES: AskChoiceInterface<MODULE_SYSTEM>[] = [
  { title: "🧩   ESM (ES Modules)         [ with vitest ]", value: MODULE_SYSTEM.ESM },
  { title: "📜   CJS (CommonJS)           [ with jest ]", value: MODULE_SYSTEM.CJS },
];


export const DATABASE_CHOICES: AskChoiceInterface<DATABASE>[] = Object.values(DATABASE).map(
  (value) => ({ title: DATABASE_META[value].label, value })
);
