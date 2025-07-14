import {
  ARCHITECTURE_TYPE,
  Constant,
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
import { resolve } from "path";
import { FsUtil } from "../utils/fs.util";
import { readFile } from "fs/promises";
import { SetUpPrismaClean } from "../temp/setUpPrismaClean";

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

  static async setUpPrisma(configChoice: ConfigChoice) {
    const targetDir = resolve(process.cwd(), configChoice.projectName);
    
    if (configChoice.isArchitectureTypeClean()) 
    {
      SetUpPrismaClean.exec(targetDir, configChoice);
    } else {

      const exec = promisify(execCb);
      MessageUtil.info('Installing Prisma...');
      await exec(`npm install prisma @prisma/client && npx prisma init`, {
        cwd: targetDir,
        shell: "/bin/bash"
      });
      MessageUtil.success('Prisma successfully installed');


      //Créer prisma service + prisma module
      const prismaDir = resolve(process.cwd(), `${configChoice.projectName}/prisma`);

      /** get Content of template file   */
      const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
      const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
      const envExampleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.ENV_EXAMPLE}`));

      /** get Content of existing file of new project  */
      let appModuleContent = await FsUtil.getFileContent(resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`));



      MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
      await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);


      MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
      await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);



      MessageUtil.info(`Generating .env.example in ${envExampleContent}...`);
      await FsUtil.createFile(`.env.example`, envExampleContent);

      MessageUtil.info(`Updating app.module.ts in ${envExampleContent}...`);
      const moduleDecoratorRegex = /@Module\s*\(\s*\{([^}]+)\}\s*\)/s;

      // a générer dynamiquement
      const importPrismaModule = "import { PrismaModule } from 'prisma/prisma.module"
      const prismaModule = "PrismaModule,"


     

      const matchContent = appModuleContent.match(/imports\s*:\s*\[(.*?)\]/s);

      if (!matchContent) {
        MessageUtil.error(`An error append when updating app.module.ts .`);
        process.exit(1)
      }

      //Add prisma import 
      appModuleContent = `${importPrismaModule} \n${appModuleContent}` 

      const currentImports = matchContent[1].trim();
      
      //add module in imports
      const newImports =`${currentImports},\n    ${prismaModule}`
        ;

      //Replace imports in app module content
      appModuleContent =  appModuleContent.replace(
        /imports\s*:\s*\[(.*?)\]/s,
        `imports: [\n    ${newImports}\n  ]`
      );
     
      //Update app.module.ts
      await FsUtil.createFile(resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`), appModuleContent);


    

      //Récupérer le contenu du app.module 
      // le modifier 
      // l'enregistrer


    }


    //prisma sevice, schema prisma , prisma module ,.env.example avec db url
    //traitement prisma
  }
}


