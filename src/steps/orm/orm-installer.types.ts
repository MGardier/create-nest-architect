import { promises as fs } from "fs";
import { resolve } from "path";
import type { DATABASE } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";
import type { VirtualTree } from "../../services/tree.service";
import { MessageUtil } from "../../utils/message.util";

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

  /** Packages installed by the post-commit install step */
  dependencies: string[];

  /** Writes its files into the tree and returns its "next steps"
   *  instructions for the final recap. No disk access. */
  run: (tree: VirtualTree, config: ConfigChoice) => Promise<string>;
}

/** Reads one of the CLI's own template assets (dist/templates at runtime). */
export const readTemplate = (relativePath: string): Promise<string> =>
  fs.readFile(resolve(__dirname, `../../templates/${relativePath}`), "utf-8");

/** Appends KEY="value" to the tree's .env.example unless already present. */
export const updateEnvExampleIfNeeded = (tree: VirtualTree, key: string, value: string): void => {
  MessageUtil.info(`\nAdding  ${key} to .env.example...`);
  const current = tree.exists(".env.example") ? tree.read(".env.example") : "";
  if (current.includes(`${key}=`)) {
    MessageUtil.info(`${key} already exists in .env.example`);
    return;
  }
  tree.write(".env.example", `${current}\n${key}="${value}"\n`);
  MessageUtil.success(`.env.example correctly updated with ${key}`);
};
