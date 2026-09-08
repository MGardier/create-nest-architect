import { promises as fs } from "fs";
import { resolve } from "path";
import type { DATABASE } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";
import type { VirtualTreeService } from "../../services/virtual-tree.service";
import { MessageUtil } from "../../utils/message.util";


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




/**
 * What an ORM *does*, as data — mirroring Step in step.types.ts: one
 * entry per file written, run in order by the accumulator loop of
 * orm.step.ts. An action is skipped when its `when` returns false, and
 * may return a string: its "next steps" instructions, concatenated
 * into the step's recap.
 *
 * Actions only write into the tree — the pipeline commits it to disk
 * once, after the last step.
 */
export interface OrmAction {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTreeService, config: ConfigChoice) => Promise<string | void>;
}

/** Reads one of the CLI's own template assets (dist/templates at runtime). */
export const readTemplate = (relativePath: string): Promise<string> =>
  fs.readFile(resolve(__dirname, `../../templates/${relativePath}`), "utf-8");

/** Appends KEY="value" to the tree's .env.example unless already present. */
export const updateEnvExampleIfNeeded = (tree: VirtualTreeService, key: string, value: string): void => {
  MessageUtil.info(`\nAdding  ${key} to .env.example...`);
  const current = tree.exists(".env.example") ? tree.read(".env.example") : "";
  if (current.includes(`${key}=`)) {
    MessageUtil.info(`${key} already exists in .env.example`);
    return;
  }
  tree.write(".env.example", `${current}\n${key}="${value}"\n`);
  MessageUtil.success(`.env.example correctly updated with ${key}`);
};



export const formatDependency = (dep: OrmDependency): string =>
  `${dep.name}@${dep.version}`;


