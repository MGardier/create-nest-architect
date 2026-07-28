import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { ARCHITECTURE_TYPE, DATABASE, DATABASE_META } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import type { OrmInstaller } from "./orm-installer.types";

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
//                              CLEAN METHOD
// =============================================================================

const setUpPrismaClean = async (targetDir: string, config: ConfigChoice): Promise<void> => {
  const exec = promisify(execCb);
  MessageUtil.info('\nMoving Prisma...');
  await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
    cwd: targetDir,
    shell: "/bin/bash"
  });
  MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);


  const prismaDir = join(targetDir, '/src/infrastructure/repositories/prisma/.config');

  MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
  const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
  await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);

  MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
  const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
  await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);

  MessageUtil.info(`\nUpdating app.module...`);
  const appModulePath = join(targetDir, '/src/app.module.ts');
  let appModuleContent = await FsUtil.getFileContent(appModulePath);

  appModuleContent =  FsUtil.addNewModuleClean(
    appModuleContent,
    `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
    `PrismaModule`
  );
  await FsUtil.createFile(appModulePath, appModuleContent);

  MessageUtil.info(`\nUpdating prisma.config...`);
  const prismaConfigPath = join(targetDir, '/prisma.config.ts');
  let prismaConfigContent = await FsUtil.getFileContent(prismaConfigPath);

  prismaConfigContent =  FsUtil.addOptionInPrismaConfig(prismaConfigContent, "  schema: 'src/infrastructure/repositories/prisma/.config/schema.prisma'")
  await FsUtil.createFile(`${targetDir}/prisma.config.ts`, prismaConfigContent);

  MessageUtil.success(`\nPrisma module correctly generating and AppModule  correctly updated.`);


  FsUtil.updateEnvExampleIfNeeded(config.projectName, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
};

// =============================================================================
//                              FEATURED  METHOD
// =============================================================================


const setUpPrismaFeatured = async (targetDir: string, config: ConfigChoice): Promise<void> => {

  const prismaDir = `${targetDir}/prisma`;
  const appModulePath = `${targetDir}/src/app.module.ts`;
  const prismaModulePath = `${prismaDir}/prisma.module.ts`;
  const prismaServicePath = `${prismaDir}/prisma.service.ts`;

  MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
  const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
  await FsUtil.createFile(prismaModulePath, prismaModuleContent);

  MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
  const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
  await FsUtil.createFile(prismaServicePath, prismaServiceContent);

  MessageUtil.info(`\nUpdating app.module...`);
  let appModuleContent = await FsUtil.getFileContent(appModulePath);
  appModuleContent = FsUtil.addNewModuleFeatured(appModuleContent, "import { PrismaModule } from 'prisma/prisma.module'", "PrismaModule")
  await FsUtil.createFile(appModulePath, appModuleContent);

  MessageUtil.success(`\nPrisma folder correctly generating and AppModule  correctly updated.`);

  FsUtil.updateEnvExampleIfNeeded(config.projectName, "DATABASE_URL", DATABASE_META[config.database].envUrlExample);
};

// =============================================================================
//                              INSTALL  METHOD
// =============================================================================

const installPrisma = async (targetDir: string, config: ConfigChoice): Promise<void> => {

  const exec = promisify(execCb);
  const { packager } = config;

  await exec(`${packager.add('prisma @prisma/client')} && ${packager.exec('prisma init')}`, {
    cwd: targetDir,
    shell: "/bin/bash"
  });
  MessageUtil.success('Prisma successfully installed');

  const prismaSchemaPath = `${targetDir}/prisma/schema.prisma`;
  let prismaSchemaContent = await FsUtil.getFileContent(prismaSchemaPath);
  prismaSchemaContent = prismaSchemaContent.replace(/^\s*output\s*=.*$/gm, '');

  // supportedDatabases only lists databases present in PRISMA_PROVIDERS
  const provider = PRISMA_PROVIDERS[config.database]!;
  prismaSchemaContent = prismaSchemaContent.replace(
    /(datasource\s+\w+\s*{[^}]*provider\s*=\s*)"[^"]*"/,
    `$1"${provider}"`
  );
  await FsUtil.createFile(prismaSchemaPath, prismaSchemaContent);


  MessageUtil.info(`\nGenerating prisma.config...`);
  let prismaConfigContent = await FsUtil.getFileContent(resolve(__dirname, `../../templates/${TEMPLATE_PATH.PRISMA_CONFIG}`));

  await FsUtil.createFile(`${targetDir}/prisma.config.ts`, prismaConfigContent);
};

// =============================================================================
//                              INSTALLER
// =============================================================================

export const prismaInstaller: OrmInstaller = {
  id: "prisma",
  label: "📦   Prisma",
  supportedDatabases: [DATABASE.MYSQL],

  async run(config: ConfigChoice): Promise<string> {
    MessageUtil.info('\nInstalling Prisma...');
    const targetDir = resolve(process.cwd(), config.projectName);

    await installPrisma(targetDir, config);

    if (config.architectureType === ARCHITECTURE_TYPE.CLEAN) {
      await setUpPrismaClean(targetDir, config);
    }
    else {
      await setUpPrismaFeatured(targetDir, config);
    }

    return `
    👉 Before starting don't forget to :

      - Create .env and connect your provider with Prisma.
      - Update schema prisma with your entities.
      - Generate prisma client and database with :
        $ ${config.packager.exec('prisma migrate dev')}
    `;
  },
};
