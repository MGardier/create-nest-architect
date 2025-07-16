import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
  REPO_TEMPLATE_URL,
  TEMPLATE_PATH,
} from "../constants/constant";
import { promises as fs } from "fs";
import { PromptUtil } from "../utils/prompt.util";
import { MessageUtil } from "../utils/message.util";
import { ConfigChoice } from "../classes/configChoice.class";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { join, resolve } from "path";
import { FsUtil } from "../utils/fs.util";

export abstract class InitProject {
  static async cloneRepo(configChoice: ConfigChoice): Promise<void> {
    const templateRepo: string =
      configChoice.architectureType === ARCHITECTURE_TYPE.CLEAN
        ? REPO_TEMPLATE_URL.CLEAN
        : REPO_TEMPLATE_URL.FEATURED;
    const projectName: string = configChoice.projectName;

    const exec = promisify(execCb);

    try {
      const { stdout, stderr } = await exec(
        `git clone --depth 1 --branch main ${templateRepo} ${projectName}`
      );
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Successfully cloned the repository")
    } catch (err) {
      MessageUtil.error("An error append when try to git clone template .");
      process.exit(1);
    }
  }

  static async collectProjectConfig(): Promise<ConfigChoice> {
    /********************** PROJECT NAME  ******************************** */
    const projectName = await PromptUtil.askProjectNameIfNeeded();
    if (!projectName) {
      MessageUtil.error("You must specify a name to create project.");
      process.exit(1);
    }
    /********************** ARCHITECTURE  ******************************** */
    const architectureType = await PromptUtil.askArchitecture();
    if (!architectureType) {
      MessageUtil.error("You must choose an architecture.");
      process.exit(1);
    }

    /********************** DB LANGUAGE  ******************************** */
    const dbLanguage = await PromptUtil.askDbLanguage();
    if (!dbLanguage) {
      MessageUtil.error("You must choose a db language.");
      process.exit(1);
    }

    /********************** ORM or ODM  ******************************** */
    let ormOrOdm: ORM_TYPE | ODM_TYPE =
      dbLanguage === DB_LANGUAGE.NOSQL
        ? await PromptUtil.askOdm()
        : await PromptUtil.askOrm();

    if (!ormOrOdm) {
      MessageUtil.error("You must choose an Orm or Odm.");
      process.exit(1);
    }
    return new ConfigChoice(
      projectName,
      architectureType,
      dbLanguage,
      ormOrOdm
    );
  }

  static async setUpMongoose(configChoice: ConfigChoice) {
    const targetDir = resolve(process.cwd(), configChoice.projectName);

    if (configChoice.isArchitectureTypeClean()) {

    }
    else {

      const exec = promisify(execCb);
      MessageUtil.info('Installing Mongoose...');
      await exec(`npm i @nestjs/mongoose mongoose`, {
        cwd: targetDir,
        shell: "/bin/bash"
      });
      MessageUtil.success('Mongoose successfully installed');

      //Ajouter une ligne au app.module.ts
      //un example d'entité pour le product  
      //un example de module pour product
     

    }
  }

  // TODO: a supprimer
  static async setUpPrismaMerge(configChoice: ConfigChoice) {

    //Get dir of new project
    const targetDir = resolve(process.cwd(), configChoice.projectName);
    let prismaDir = resolve(process.cwd(), `${configChoice.projectName}/prisma`);

    //Install and init prisma 
    const exec = promisify(execCb);
    MessageUtil.info('Installing Prisma...');
    await exec(`npm install prisma @prisma/client && npx prisma init`, {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success('Prisma successfully installed');

    if (configChoice.isArchitectureTypeClean()) {
      //Move prisma dir to infrastructure layered
      MessageUtil.info('Moving Prisma...');
      await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
        cwd: targetDir,
        shell: "/bin/bash"
      });
      MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);
      prismaDir = resolve(process.cwd(), `${configChoice.projectName}/src/infrastructure/repositories/prisma/.config`);
    }

    //Get content of templates
    const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
    const prismaModulePath = `${prismaDir}/prisma.module.ts`;

    const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
    const prismaServicePath = `${prismaDir}/prisma.service.ts`;

    let envExampleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.ENV_EXAMPLE}`));
    const envExamplePath = `.env.example`;

    const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
    let appModuleContent = await FsUtil.getFileContent(resolve(process.cwd(), appModulePath));



    //Creating new file with templat content
    MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
    await FsUtil.createFile(prismaModulePath, prismaModuleContent);

    MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
    await FsUtil.createFile(prismaServicePath, prismaServiceContent);



    if (configChoice.isArchitectureTypeClean()) {

      MessageUtil.info(`Updating app.module...`);

      //Add prisma import in app module
      appModuleContent = appModuleContent.replace(
        /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
        `$1 import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module';`
      );

      //Add prisma module in app module
      appModuleContent = appModuleContent.replace(
        /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
        `$1 PrismaModule,`
      );

    }
    else {
      const matchContent = appModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

      if (!matchContent) {
        MessageUtil.error(`An error append when updating app.module.ts .`);
        process.exit(1)
      }


      //Add prisma import 
      appModuleContent = `import { PrismaModule } from 'prisma/prisma.module \n${appModuleContent}`

      const currentImports = matchContent[1].trim();

      //add module in imports
      const newImports = `${currentImports},\n    PrismaModule,`
        ;

      //Replace imports in app module content
      appModuleContent = appModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newImports}\n  ]`
      );


    }
    //Update app.module.ts
    await FsUtil.createFile(appModulePath, appModuleContent);

    const packageJsonPath = join(targetDir, 'package.json');
    const packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
    const packageJson = JSON.parse(packageJsonContent);

    packageJson.prisma = {
      schema: configChoice.isArchitectureTypeClean() ? "src/infrastructure/repositories/prisma/.config/schema.prisma" : "prisma/.config/schema.prisma",
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)); 
    MessageUtil.success('Added prisma.schema path to package.json');


        // Ajoute la variable si elle n'existe pas déjà (précaution)
        if (!envExampleContent.includes('DATABASE_URL=')) {
            envExampleContent += `\nDATABASE_URL="provider://user:password@host:port/database"\n`;
            await FsUtil.createFile(envExamplePath, envExampleContent);
            MessageUtil.success('Added DATABASE_URL to .env.example');
        } 
  }

}


