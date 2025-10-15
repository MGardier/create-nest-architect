import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { TEMPLATE_PATH } from "../constants/constant";

export abstract class SetUpPrisma {


  /********************** EXEC METHOD   ***************************************************************************************************************/
  static async exec(configChoice: ConfigChoice): Promise<string> {
    MessageUtil.info('\nInstalling Prisma...');
    const targetDir = resolve(process.cwd(), configChoice.projectName);

    await this.installPrisma(targetDir, configChoice);

    if (configChoice.isArchitectureTypeClean()) {
      await this.setUpPrismaClean(targetDir, configChoice);
    }
    else {
      await this.setUpPrismaFeatured(targetDir, configChoice);
    }
    
    return `
    👉 Before starting dont forget to : 

      - Create .env and connect your provider with Prisma.
      - Update schema prisma with your entites.
      - Generate prisma client and database with :
        $ npx prisma migrate dev
    `;
  }


  /********************** CLEAN METHOD    *********************************************************************************************************/
  static async setUpPrismaClean(targetDir: string, configChoice: ConfigChoice): Promise<void> {
    const exec = promisify(execCb);
    MessageUtil.info('\nMoving Prisma...');
    await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);


    const prismaDir = join(targetDir, '/src/infrastructure/repositories/prisma/.config');

    MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
    const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
    await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);

    MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
    const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
    await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);

    MessageUtil.info(`\nUpdating app.module...`);
    const appModulePath = join(targetDir, '/src/app.module.ts');
    let appModuleContent = await FsUtil.getFileContent(appModulePath);

    appModuleContent = await FsUtil.addNewModuleClean(
      appModuleContent,
      `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
      `PrismaModule`
    );
    await FsUtil.createFile(appModulePath, appModuleContent);

    MessageUtil.info(`\nUpdating prisma.config...`);
    const prismaConfigPath = join(targetDir, '/prisma.config.ts');
    let prismaConfigContent = await FsUtil.getFileContent(prismaConfigPath);

    prismaConfigContent = await FsUtil.addOptionInPrismaConfig(prismaConfigContent, "  schema: 'src/infrastructure/repositories/prisma/.config/schema.prisma'")
    await FsUtil.createFile(`${targetDir}/prisma.config.ts`, prismaConfigContent);

    MessageUtil.success(`\nPrisma module  correctly generating and AppModule  correctly updated.`);


    FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "DATABASE_URL", "provider://user:password@host:port/database");
  }


  /********************** FEATURED  METHOD   ******************************************************************************************************/
  static async setUpPrismaFeatured(targetDir: string, configChoice: ConfigChoice) {

    const prismaDir = `${targetDir}/prisma`;
    const appModulePath = `${targetDir}/src/app.module.ts`;
    const prismaModulePath = `${prismaDir}/prisma.module.ts`;
    const prismaServicePath = `${prismaDir}/prisma.service.ts`;

    MessageUtil.info(`\nGenerating prisma.module in ${prismaDir}...`);
    const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
    await FsUtil.createFile(prismaModulePath, prismaModuleContent);

    MessageUtil.info(`\nGenerating prisma.service in ${prismaDir}...`);
    const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
    await FsUtil.createFile(prismaServicePath, prismaServiceContent);

    MessageUtil.info(`\nUpdating app.module...`);
    let appModuleContent = await FsUtil.getFileContent(appModulePath);
    appModuleContent = FsUtil.addNewModuleFeatured(appModuleContent, "import { PrismaModule } from 'prisma/prisma.module'", "PrismaModule")
    await FsUtil.createFile(appModulePath, appModuleContent);

    MessageUtil.success(`\nPrisma folder  correctly generating and AppModule  correctly updated.`);

    FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "DATABASE_URL", "provider://user:password@host:port/database");

  }



  /********************** INSTALL  METHOD   ******************************** **********************************************************************/

  static async installPrisma(targetDir: string, configChoice: ConfigChoice): Promise<void> {

    const exec = promisify(execCb);
    const { packager } = configChoice;

    await exec(`${packager.add('prisma @prisma/client')} && ${packager.exec('prisma init')}`, {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success('Prisma successfully installed');

    const prismaSchemaPath = `${targetDir}/prisma/schema.prisma`;
    let prismaSchemaContent = await FsUtil.getFileContent(prismaSchemaPath);
    const newPrismaSchemaContent = prismaSchemaContent.replace(/^\s*output\s*=.*$/gm, '')
    await FsUtil.createFile(prismaSchemaPath, newPrismaSchemaContent);


    MessageUtil.info(`\nGenerating prisma.config...`);
    let prismaConfigContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_CONFIG}`));

    await FsUtil.createFile(`${targetDir}/prisma.config.ts`, prismaConfigContent);

  }
}