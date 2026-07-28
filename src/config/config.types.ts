import { ARCHITECTURE_TYPE, DATABASE, PACKAGER_TYPE } from "./choices";
import { IPackagerCommands } from "../constants/packager.constants";

/**
 * The configuration being collected: plain data, filled question by
 * question by the accumulator loop. `orm` holds an installer id from
 * the registry (steps/orm/registry.ts) — the registry, not the type
 * system, is the source of truth for orm/database compatibility.
 */
export interface ConfigData {
  projectName: string;
  packagerType: PACKAGER_TYPE;
  architectureType: ARCHITECTURE_TYPE;
  database: DATABASE;
  orm: string;
}

export type PartialConfig = Partial<ConfigData>;

/**
 * The validated configuration handed to the pipeline. Built once by
 * validateConfig(): orm/database compatibility checked against the
 * registry, and packager commands resolved once.
 */
export type ConfigChoice = Readonly<ConfigData & { packager: IPackagerCommands }>;
