import { promises as fs } from "fs";
import { resolve } from "path";
import type { DATABASE } from "../../config/choices";
import type { StepAction } from "../step.types";


export interface OrmDependency {
  name: string;
  version: string;
  scope: "dependencies" | "devDependencies";
}


/**
 * What an ORM *is*: metadata only, consulted by the prompt, the
 * validation and the post-commit install. What an ORM *does* lives in
 * its actions — the two are deliberately kept apart.
 *
 * Compatibility is a property of the ORM: it knows what it supports.
 * The database is not an ORM, it is a parameter: the setup picks what
 * varies from DATABASE_META[config.database].
 */
export interface OrmMeta {
  /** 'prisma' | 'mongoose' — becomes the prompt value */
  id: string;

  /** Prompt display */
  label: string;

  /** THE compatibility matrix, one line per ORM */
  supportedDatabases: DATABASE[];

  /** Packages installed by the post-commit install step */
  dependencies: OrmDependency[];
}




/** One entry per file written, run in order by orm.step.ts. */
export interface OrmAction extends StepAction {}

/** Reads one of the CLI's own template assets (dist/templates at runtime). */
export const readTemplate = (relativePath: string): Promise<string> =>
  fs.readFile(resolve(__dirname, `../../templates/${relativePath}`), "utf-8");

export const formatDependency = (dep: OrmDependency): string =>
  `${dep.name}@${dep.version}`;


