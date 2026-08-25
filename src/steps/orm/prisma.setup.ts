import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import { OrmMeta, readTemplate, updateEnvExampleIfNeeded } from "./orm-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const PRISMA_META: OrmMeta = {
  id: "prisma",
  label: "📦   Prisma",
  supportedDatabases: [DATABASE.MYSQL],
  dependencies: ["prisma", "@prisma/client"],
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
  [DATABASE.MYSQL]: "mysql",
};

// =============================================================================
//                              PATHS
// =============================================================================

/**
 * The only thing the architecture changes for most of the files: where
 * they land. Clean keeps Prisma inside the infrastructure layer,
 * Featured keeps it at the project root.
 */
const prismaDir = (config: ConfigChoice): string =>
  config.architectureType === ARCHITECTURE_TYPE.CLEAN
    ? "src/infrastructure/repositories/prisma/.config"
    : "prisma";

// =============================================================================
//                              SETUP
// =============================================================================

/**
 * One method per file written, in the order of PRISMA_ACTIONS
 * (orm.step.ts). Each method resolves its own target path and its own
 * architecture variant: the action table stays free of conditions.
 */
export const PrismaSetup = {

  writeSchema: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const schemaPath = `${prismaDir(config)}/schema.prisma`;
    MessageUtil.info(`\nGenerating ${schemaPath}...`);

    // supportedDatabases only lists databases present in PRISMA_PROVIDERS
    const provider = PRISMA_PROVIDERS[config.database]!;
    const schemaContent = (await readTemplate(TEMPLATE_PATH.prisma.schema)).replace("__PROVIDER__", provider);
    tree.write(schemaPath, schemaContent);
  },

  writeModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const dir = prismaDir(config);
    MessageUtil.info(`\nGenerating prisma.module in ${dir}...`);
    tree.write(`${dir}/prisma.module.ts`, await readTemplate(TEMPLATE_PATH.prisma.module));
  },

  writeService: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    const dir = prismaDir(config);
    MessageUtil.info(`\nGenerating prisma.service in ${dir}...`);
    tree.write(`${dir}/prisma.service.ts`, await readTemplate(TEMPLATE_PATH.prisma.service));
  },

  updateAppModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nUpdating app.module...`);
    const isClean = config.architectureType === ARCHITECTURE_TYPE.CLEAN;

    const appModuleContent = isClean
      ? FsUtil.addNewModuleClean(
        tree.read("src/app.module.ts"),
        `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
        `PrismaModule`
      )
      : FsUtil.addNewModuleFeatured(
        tree.read("src/app.module.ts"),
        "import { PrismaModule } from 'prisma/prisma.module'",
        "PrismaModule"
      );

    tree.write("src/app.module.ts", appModuleContent);
  },

  writePrismaConfig: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nGenerating prisma.config...`);
    const template = await readTemplate(TEMPLATE_PATH.prisma.config);

    // Featured lives where Prisma looks by default, Clean must say where its schema is
    const prismaConfigContent = config.architectureType === ARCHITECTURE_TYPE.CLEAN
      ? FsUtil.addOptionInPrismaConfig(template, `  schema: '${prismaDir(config)}/schema.prisma'`)
      : template;

    tree.write("prisma.config.ts", prismaConfigContent);
  },

  updateEnvExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
  },

  /** Writes nothing: closes the setup and returns its recap. */
  nextSteps: async (_tree: VirtualTreeService, config: ConfigChoice): Promise<string> => {
    const isClean = config.architectureType === ARCHITECTURE_TYPE.CLEAN;
    MessageUtil.success(
      isClean
        ? `\nPrisma module correctly generating and AppModule  correctly updated.`
        : `\nPrisma folder correctly generating and AppModule  correctly updated.`
    );

    return `
    👉 Before starting don't forget to :

      - Create .env and connect your provider with Prisma.
      - Update schema prisma with your entities.
      - Generate prisma client and database with :
        $ ${config.packager.exec('prisma migrate dev')}
    `;
  },
};
