import { DATABASE } from "../../config/choices";
import { mongooseInstaller } from "./mongoose.installer";
import type { OrmInstaller } from "./orm-installer.types";
import { prismaInstaller } from "./prisma.installer";

/**
 * The single source of truth for which ORMs exist and what they
 * support. The prompt (questions.ts), the validation (validate.ts)
 * and the dispatch (orm.step.ts) all consult this registry.
 * Adding an ORM = one installer file + one line here.
 */
export const ORM_INSTALLERS: OrmInstaller[] = [prismaInstaller, mongooseInstaller];

export const findOrmInstaller = (id: string): OrmInstaller | undefined =>
  ORM_INSTALLERS.find((installer) => installer.id === id);

export const ormsForDatabase = (database: DATABASE): OrmInstaller[] =>
  ORM_INSTALLERS.filter((installer) => installer.supportedDatabases.includes(database));
