import { AskChoiceInterface } from "../services/prompt";

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

export enum DATABASE {
  MYSQL = "mysql",
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
export interface DatabaseMeta {
  /** Prompt display */
  label: string;

  /** What the installer writes in .env.example */
  envUrlExample: string;

  /** For the future docker-compose */
  dockerImage?: string;
}

export const DATABASE_META: Record<DATABASE, DatabaseMeta> = {
  [DATABASE.MYSQL]: {
    label: "🐬  MySQL",
    envUrlExample: "mysql://user:password@localhost:3306/mydb",
    dockerImage: "mysql:9",
  },
  [DATABASE.MONGODB]: {
    label: "🍃  MongoDB",
    envUrlExample: "mongodb://user:password@localhost:27017/mydb",
    dockerImage: "mongo:8",
  },
};

// =============================================================================
//                CHOICES (labels colocated with their enums)
// =============================================================================

export const ARCHITECTURE_CHOICES: AskChoiceInterface[] = [
  { title: "🏷️   Featured Architecture", value: ARCHITECTURE_TYPE.FEATURED },
  { title: "🏛️   Clean Architecture", value: ARCHITECTURE_TYPE.CLEAN },
];

export const PACKAGER_CHOICES: AskChoiceInterface[] = [
  { title: "📦   npm", value: PACKAGER_TYPE.NPM },
  { title: "⚡   pnpm", value: PACKAGER_TYPE.PNPM },
  { title: "🧶   Yarn", value: PACKAGER_TYPE.YARN },
  { title: "🍞   Bun", value: PACKAGER_TYPE.BUN },
];

export const DATABASE_CHOICES: AskChoiceInterface[] = Object.entries(DATABASE_META).map(
  ([value, meta]) => ({ title: meta.label, value })
);
