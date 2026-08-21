import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTree } from "../../services/tree.service";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import { OrmInstaller, readTemplate, updateEnvExampleIfNeeded } from "./orm-installer.types";

// =============================================================================
//                              PRISMA PROVIDERS
// =============================================================================

/**
 * schema.prisma datasource provider per database — Prisma-specific
 * knowledge, so it lives with the installer, not in DATABASE_META.
 * One entry per database of supportedDatabases below.
 */
const PRISMA_PROVIDERS: Partial<Record<DATABASE, string>> = {
  [DATABASE.MYSQL]: "mysql",
};

// =============================================================================
//                              SCHEMA
// =============================================================================

const writeSchema = async (tree: VirtualTree, config: ConfigChoice, schemaPath: string): Promise<void> => {
  MessageUtil.info(`\nGenerating ${schemaPath}...`);
  // supportedDatabases only lists databases present in PRISMA_PROVIDERS
  const provider = PRISMA_PROVIDERS[config.database]!;
  const schemaContent = (await readTemplate(TEMPLATE_PATH.prisma.schema)).replace("__PROVIDER__", provider);
  tree.write(schemaPath, schemaContent);
};

// =============================================================================
//                              CLEAN METHOD
// =============================================================================

const setUpPrismaClean = async (tree: VirtualTree, config: ConfigChoice): Promise<void> => {
  const prismaDir = "src/infrastructure/repositories/prisma/.config";

  await writeSchema(tree, config, `${prismaDir}/schema.prisma`);

  MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
  tree.write(`${prismaDir}/prisma.module.ts`, await readTemplate(TEMPLATE_PATH.prisma.module));

  MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
  tree.write(`${prismaDir}/prisma.service.ts`, await readTemplate(TEMPLATE_PATH.prisma.service));

  MessageUtil.info(`\nUpdating app.module...`);
  const appModuleContent = FsUtil.addNewModuleClean(
    tree.read("src/app.module.ts"),
    `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
    `PrismaModule`
  );
  tree.write("src/app.module.ts", appModuleContent);

  MessageUtil.info(`\nGenerating prisma.config...`);
  const prismaConfigContent = FsUtil.addOptionInPrismaConfig(
    await readTemplate(TEMPLATE_PATH.prisma.config),
    `  schema: '${prismaDir}/schema.prisma'`
  );
  tree.write("prisma.config.ts", prismaConfigContent);

  MessageUtil.success(`\nPrisma module correctly generating and AppModule  correctly updated.`);
};

// =============================================================================
//                              FEATURED  METHOD
// =============================================================================

const setUpPrismaFeatured = async (tree: VirtualTree, config: ConfigChoice): Promise<void> => {
  const prismaDir = "prisma";

  await writeSchema(tree, config, `${prismaDir}/schema.prisma`);

  MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
  tree.write(`${prismaDir}/prisma.module.ts`, await readTemplate(TEMPLATE_PATH.prisma.module));

  MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
  tree.write(`${prismaDir}/prisma.service.ts`, await readTemplate(TEMPLATE_PATH.prisma.service));

  MessageUtil.info(`\nUpdating app.module...`);
  const appModuleContent = FsUtil.addNewModuleFeatured(
    tree.read("src/app.module.ts"),
    "import { PrismaModule } from 'prisma/prisma.module'",
    "PrismaModule"
  );
  tree.write("src/app.module.ts", appModuleContent);

  MessageUtil.info(`\nGenerating prisma.config...`);
  tree.write("prisma.config.ts", await readTemplate(TEMPLATE_PATH.prisma.config));

  MessageUtil.success(`\nPrisma folder correctly generating and AppModule  correctly updated.`);
};

// =============================================================================
//                              INSTALLER
// =============================================================================

export const prismaInstaller: OrmInstaller = {
  id: "prisma",
  label: "📦   Prisma",
  supportedDatabases: [DATABASE.MYSQL],
  dependencies: ["prisma", "@prisma/client"],

  async run(tree: VirtualTree, config: ConfigChoice): Promise<string> {
    MessageUtil.info('\nInstalling Prisma...');

    if (config.architectureType === ARCHITECTURE_TYPE.CLEAN) {
      await setUpPrismaClean(tree, config);
    }
    else {
      await setUpPrismaFeatured(tree, config);
    }

    updateEnvExampleIfNeeded(tree, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);

    return `
    👉 Before starting don't forget to :

      - Create .env and connect your provider with Prisma.
      - Update schema prisma with your entities.
      - Generate prisma client and database with :
        $ ${config.packager.exec('prisma migrate dev')}
    `;
  },
};
