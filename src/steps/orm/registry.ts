import { DATABASE } from "../../config/choices";
import { MONGOOSE_META } from "./mongoose.setup";
import type { OrmMeta } from "./orm-setup.types";
import { PRISMA_META } from "./prisma.setup";

/**
 * The single source of truth for which ORMs exist and what they
 * support. The prompt (questions.ts), the validation (validate.ts) and
 * the post-commit install (install.step.ts) all consult this registry.
 * What an ORM does is not here: it lives in its action table
 * (orm.step.ts).
 *
 * Adding an ORM = one setup file + one line here.
 */
export const ORM_META: OrmMeta[] = [PRISMA_META, MONGOOSE_META];

export const findOrmMeta = (id: string): OrmMeta | undefined =>
  ORM_META.find((meta) => meta.id === id);

export const ormsForDatabase = (database: DATABASE): OrmMeta[] =>
  ORM_META.filter((meta) => meta.supportedDatabases.includes(database));
