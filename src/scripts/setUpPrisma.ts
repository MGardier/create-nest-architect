import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { TEMPLATE_PATH } from "../constants/constant";
import { promises as fs } from "fs";

export abstract class SetUpPrisma {

    //Todo : Sortir les choses génériques 
    //Todo : v2 tester et gestions des erreurs
    // Todo : rajouter des comportements à exec 
    //TODO: Rajouter des commentaires séparateur 


    /********************** EXEC METHOD   ***************************************************************************************************************/
    //responsability : install prisma and call the right function for configure prisma 
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
    //responsability : configure prisma in clean architecture project
    static async setUpPrismaClean(targetDir: string, configChoice: ConfigChoice): Promise<void>  {
        const exec = promisify(execCb);
        MessageUtil.info('Moving Prisma...');
        await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);

        const prismaDir = resolve(process.cwd(), `${configChoice.projectName}/src/infrastructure/repositories/prisma/.config`);

        const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
        const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));

        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        let appModuleContent = await FsUtil.getFileContent(appModulePath);

        MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);

        MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);

        

        appModuleContent = await  FsUtil.addImportInModuleClean(
            appModuleContent,
            `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
            `PrismaModule`
        );

    

        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);

        // ajout dans le package.json
        const packageJsonPath = join(targetDir, 'package.json');
        const packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
        const packageJson = JSON.parse(packageJsonContent);

        packageJson.prisma = {
            schema: "src/infrastructure/repositories/prisma/.config/schema.prisma"
        };

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)); // indentation
        MessageUtil.success('Added prisma.schema path to package.json');

        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName,"DATABASE_URL","provider://user:password@host:port/database");
    }


      /********************** FEATURED  METHOD   ******************************************************************************************************/
      //responsability : configure prisma in featured architecture project
      static async setUpPrismaFeatured(targetDir: string, configChoice: ConfigChoice) {
    
        //Get all path for project
        const  prismaDir = resolve(process.cwd(), `${configChoice.projectName}/prisma`);
        const appModulePath = resolve(process.cwd(), `${configChoice.projectName}/src/app.module.ts`);
        const prismaModulePath = `${prismaDir}/prisma.module.ts`;
        const prismaServicePath = `${prismaDir}/prisma.service.ts`;

        //Get content of prisma templates
        const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
        const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
        

    
        //Get content of current app.module in project 
        let appModuleContent = await FsUtil.getFileContent(appModulePath);
    
        //Creating new file with templat content
        MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
        await FsUtil.createFile(prismaModulePath, prismaModuleContent);
    
        MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
        await FsUtil.createFile(prismaServicePath, prismaServiceContent);


        //Add prisma import file and prisma import module in current appModule content
        appModuleContent =  FsUtil.addLineInFileFeatured(appModuleContent,"import { PrismaModule } from 'prisma/prisma.module'","PrismaModule")
    
        

        //update app.module file
        await FsUtil.createFile(appModulePath, appModuleContent);

        MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);
   
        //Add db url if .env.examplke didnt have one
        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName,"DATABASE_URL","provider://user:password@host:port/database");
    
    }
  


      /********************** PRISMA  METHOD   ******************************** **********************************************************************/

    //responsability : install prisma
    static  async installPrisma(targetDir: string): Promise<void> {

        const exec = promisify(execCb);
        MessageUtil.info('Installing Prisma...');
        await exec(`npm install prisma @prisma/client && npx prisma init`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success('Prisma successfully installed');
    }
}