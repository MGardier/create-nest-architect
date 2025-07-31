import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { TEMPLATE_PATH } from "../constants/constant";
import { promises as fs } from "fs";

export abstract class SetUpPrisma {


  /********************** EXEC METHOD   ***************************************************************************************************************/
  static async exec(configChoice: ConfigChoice): Promise<void> {
    const targetDir = resolve(process.cwd(), configChoice.projectName);

    await this.installPrisma(targetDir);

    if (configChoice.isArchitectureTypeClean()) {
      await this.setUpPrismaClean(targetDir, configChoice);
    }
    else {
      await this.setUpPrismaFeatured(targetDir, configChoice);
    }
  }


  /********************** CLEAN METHOD    *********************************************************************************************************/
  static async setUpPrismaClean(targetDir: string, configChoice: ConfigChoice): Promise<void> {
    const exec = promisify(execCb);
    MessageUtil.info('Moving Prisma...');
    await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);

   
    const prismaDir = join(targetDir,'/src/infrastructure/repositories/prisma/.config');

    const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));

    const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));

    const appModulePath = join(targetDir,'/src/app.module.ts');
    let appModuleContent = await FsUtil.getFileContent(appModulePath);

    MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
    await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);

    MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
    await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);

    appModuleContent = await FsUtil.addNewModuleClean(
      appModuleContent,
      `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
      `PrismaModule`
    );


    await FsUtil.createFile(appModulePath, appModuleContent);
    MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);

    
    let prismaConfigContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_CONFIG}`));
    prismaConfigContent = await FsUtil.addOptionInPrismaConfig(prismaConfigContent,"  schema: 'src/infrastructure/repositories/prisma/.config/schema.prisma'")

    await FsUtil.createFile(`${targetDir}/prisma.config.ts`, prismaConfigContent);


    FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "DATABASE_URL", "provider://user:password@host:port/database");
  }


  /********************** FEATURED  METHOD   ******************************************************************************************************/
  static async setUpPrismaFeatured(targetDir: string, configChoice: ConfigChoice) {

    const prismaDir = `${targetDir}/prisma`;
    const appModulePath = `${targetDir}/src/app.module.ts`;
    const prismaModulePath = `${prismaDir}/prisma.module.ts`;
    const prismaServicePath = `${prismaDir}/prisma.service.ts`;

    const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
    const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));

    let appModuleContent = await FsUtil.getFileContent(appModulePath);
    appModuleContent = FsUtil.addNewModuleFeatured(appModuleContent, "import { PrismaModule } from 'prisma/prisma.module'", "PrismaModule")

    MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
    await FsUtil.createFile(prismaModulePath, prismaModuleContent);

    MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
    await FsUtil.createFile(prismaServicePath, prismaServiceContent);

    await FsUtil.createFile(appModulePath, appModuleContent);

    MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);


    let prismaConfigContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_CONFIG}`));
    await FsUtil.createFile(`${prismaDir}/prisma.ts`, prismaConfigContent);

    FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "DATABASE_URL", "provider://user:password@host:port/database");

  }



  /********************** INSTALL  METHOD   ******************************** **********************************************************************/

  static async installPrisma(targetDir: string): Promise<void> {

    const exec = promisify(execCb);
    MessageUtil.info('Installing Prisma...');

    await exec(`npm install prisma @prisma/client && npx prisma init`, {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success('Prisma successfully installed');

    const prismaSchemaPath = `${targetDir}/prisma/schema.prisma`;
    let prismaSchemaContent = await FsUtil.getFileContent(prismaSchemaPath);
    const newPrismaSchemaContent = prismaSchemaContent.replace(/^\s*output\s*=.*$/gm, '')
    await FsUtil.createFile(prismaSchemaPath, newPrismaSchemaContent);

    

  }
}