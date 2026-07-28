import type { DATABASE } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";

/**
 * An installer declares who it is (metadata, consulted by the prompt
 * and the validation) and what it does (run). Compatibility is a
 * property of the installer: it knows what it supports.
 *
 * The database is not an installer, it is a parameter: run() picks
 * what varies from DATABASE_META[config.database].
 */
export interface OrmInstaller {
  /** 'prisma' | 'mongoose' — becomes the prompt value */
  id: string;

  /** Prompt display */
  label: string;

  /** THE compatibility matrix, one line per installer */
  supportedDatabases: DATABASE[];

  /** Returns its "next steps" instructions for the final recap.
   *  (The VirtualTree slips into this signature at PR 4.) */
  run: (config: ConfigChoice) => Promise<string>;
}
