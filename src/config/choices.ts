import { AskChoiceInterface } from "../services/prompt";

/************************ ENUMS ***********************************/

export enum ARCHITECTURE_TYPE {
  FEATURED = "FEATURED",
  CLEAN = "CLEAN",
}

export enum DB_LANGUAGE {
  SQL = "SQL",
  NOSQL = "NOSQL",
}

export enum ORM_TYPE {
  PRISMA = "PRISMA",
}

export enum ODM_TYPE {
  MONGOOSE = "MONGOOSE",
}

export enum PACKAGER_TYPE {
  NPM = "NPM",
  PNPM = "PNPM",
  YARN = "YARN",
  BUN = "BUN",
}

/************************ CHOICES (labels colocated with their enums) ***********************************/

export const ARCHITECTURE_CHOICES: AskChoiceInterface[] = [
  { title: "🏷️   Featured Architecture", value: ARCHITECTURE_TYPE.FEATURED },
  { title: "🏛️   Clean Architecture", value: ARCHITECTURE_TYPE.CLEAN },
];

export const DB_LANGUAGE_CHOICES: AskChoiceInterface[] = [
  { title: "🗃️    Sql", value: DB_LANGUAGE.SQL },
  { title: "📦   NoSql", value: DB_LANGUAGE.NOSQL },
];

export const ORM_CHOICES: AskChoiceInterface[] = [
  { title: "📦   Prisma", value: ORM_TYPE.PRISMA },
];

export const ODM_CHOICES: AskChoiceInterface[] = [
  { title: "📦   Mongoose", value: ODM_TYPE.MONGOOSE },
];

export const PACKAGER_CHOICES: AskChoiceInterface[] = [
  { title: "📦   npm", value: PACKAGER_TYPE.NPM },
  { title: "⚡   pnpm", value: PACKAGER_TYPE.PNPM },
  { title: "🧶   Yarn", value: PACKAGER_TYPE.YARN },
  { title: "🍞   Bun", value: PACKAGER_TYPE.BUN },
];
