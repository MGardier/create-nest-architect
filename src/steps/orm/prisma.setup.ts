import { posix } from "path";
import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { ModuleInjectorService } from "../../services/module-injector/module-injector.service";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { MessageUtil } from "../../utils/message.util";
import { importPathFor, readTemplateFor } from "../module/module-system.util";
import { OrmMeta, updateEnvExampleIfNeeded } from "./orm-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const PRISMA_META: OrmMeta = {
  id: "prisma",
  label: "📦   Prisma",
  supportedDatabases: [DATABASE.POSTGRESQL],
  dependencies: [
    { name: "prisma", version: "^7.10.0", scope: "devDependencies" },

    // The generated client needs its runtime, and Prisma 7 needs a driver adapter
    { name: "@prisma/client", version: "^7.10.0", scope: "dependencies" },
    { name: "@prisma/adapter-pg", version: "^7.10.0", scope: "dependencies" },

    // prisma.config.ts loads the .env itself: Prisma 7 no longer does it
    { name: "dotenv", version: "^18.0.0", scope: "devDependencies" },
  ],
};

// =============================================================================
//                              PRISMA PROVIDERS
// =============================================================================

/**
 * schema.prisma datasource provider per database — Prisma-specific
 * knowledge, so it lives with the setup, not in DATABASE_META.
 * One entry per database of PRISMA_META.supportedDatabases.
 */
const PRISMA_PROVIDERS: Partial<Record<DATABASE, string>> = {
  [DATABASE.POSTGRESQL]: "postgresql",
};

// =============================================================================
//                              PATHS
// =============================================================================

/** The schema belongs to the Prisma CLI; the Nest sources stay under src, or `nest build` rejects them. */

/** Where the Prisma CLI reads its schema and writes its migrations. */
const schemaDir = (config: ConfigChoice): string =>
  config.architectureType === ARCHITECTURE_TYPE.CLEAN
    ? "src/infrastructure/repositories/prisma/.config"
    : "prisma";

/** Where the Nest module and service land, always under src. */
const nestModuleDir = (config: ConfigChoice): string =>
  config.architectureType === ARCHITECTURE_TYPE.CLEAN
    ? "src/infrastructure/repositories/prisma/.config"
    : "src/database/prisma";

/** Next to the service that extends it, so its import stays "./generated/client". */
const generatedClientDir = (config: ConfigChoice): string =>
  posix.join(nestModuleDir(config), "generated");

/** The generator's `output`, which Prisma resolves from the schema file. */
const generatedClientPathFromSchema = (config: ConfigChoice): string => {
  const path = posix.relative(schemaDir(config), generatedClientDir(config));

  return path.startsWith(".") ? path : `./${path}`;
};

/** The PrismaModule as src/app.module.ts sees it. */
const prismaModuleImportPath = (config: ConfigChoice): string =>
  importPathFor(config, `./${posix.relative("src", nestModuleDir(config))}/prisma.module`);

// =============================================================================
//                              SETUP
// =============================================================================

/** One method per file written, in the order of PRISMA_ACTIONS (orm.step.ts). */
export const PrismaSetup = {

  writeSchema: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const schemaPath = `${schemaDir(config)}/schema.prisma`;
    MessageUtil.info(`\nGenerating ${schemaPath}...`);

    // supportedDatabases only lists databases present in PRISMA_PROVIDERS
    const provider = PRISMA_PROVIDERS[config.database]!;

    const schema = (await readTemplateFor(config, TEMPLATE_PATH.prisma.schema))
      .replace("__PROVIDER__", provider)
      .replace("__OUTPUT__", generatedClientPathFromSchema(config));

    tree.write(schemaPath, schema);
  },

  writeModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const dir = nestModuleDir(config);
    MessageUtil.info(`\nGenerating prisma.module in ${dir}...`);

    tree.write(`${dir}/prisma.module.ts`, await readTemplateFor(config, TEMPLATE_PATH.prisma.module));
  },

  writeService: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const dir = nestModuleDir(config);
    MessageUtil.info(`\nGenerating prisma.service in ${dir}...`);

    tree.write(`${dir}/prisma.service.ts`, await readTemplateFor(config, TEMPLATE_PATH.prisma.service));
  },

  updateAppModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nUpdating app.module...`);

    tree.write("src/app.module.ts", ModuleInjectorService.addModuleImport(
      tree.read("src/app.module.ts"),
      {
        importPath: prismaModuleImportPath(config),
        namedImports: ["PrismaModule"],
        entry: "PrismaModule",
      }
    ));
  },

  writePrismaConfig: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nGenerating prisma.config...`);

    const template = await readTemplateFor(config, TEMPLATE_PATH.prisma.config);

    // Prisma 7 no longer guesses the schema location
    tree.write("prisma.config.ts", ModuleInjectorService.addPrismaConfigOption(
      template,
      "schema",
      `'${schemaDir(config)}/schema.prisma'`
    ));
  },

  updateEnvExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
  },

  /** Writes nothing: closes the setup and returns its recap. */
  nextSteps: async (_tree: VirtualTreeService, config: ConfigChoice): Promise<string> => {
    MessageUtil.success(`\nPrisma correctly generated and AppModule correctly updated.`);

    return `
    👉 Before starting don't forget to :

      - Create .env and set DATABASE_URL to your database connection string.
      - Add your models to ${schemaDir(config)}/schema.prisma.
      - Generate the client and the database with :
        $ ${config.packager.exec('prisma migrate dev')}

      The client is generated in ${generatedClientDir(config)} and imported by prisma.service.
    `;
  },
};
