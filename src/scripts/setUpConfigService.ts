import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { TEMPLATE_PATH } from "../constants/constant";
import { promises as fs } from "fs";


//TODO: add config in app module 



export abstract class SetUpConfig {
   /********************** EXEC METHOD   ***************************************************************************************************************/
    static async exec(configChoice: ConfigChoice): Promise<void> {
      const targetDir = resolve(process.cwd(), configChoice.projectName);
  
      await this.installConfig(targetDir);
  
      if (configChoice.isArchitectureTypeClean()) {
        await this.setUpConfigClean(targetDir, configChoice);
      }
      else {
        await this.setUpConfigFeatured(targetDir, configChoice);
      }
    }


    
      /********************** CLEAN METHOD    *********************************************************************************************************/
      static async setUpConfigClean(targetDir: string, configChoice: ConfigChoice): Promise<void> {
        const exec = promisify(execCb);
        MessageUtil.info('Moving Prisma...');
        await exec(`mkdir -p src/infrastructure/repositories/prisma/.config && mv prisma/* src/infrastructure/repositories/prisma/.config && rmdir prisma`, {
          cwd: targetDir,
          shell: "/bin/bash"
        });
        MessageUtil.success(`Prisma moved in src/infrastructure/repositories/prisma/.config`);
    
        const prismaDir = `${targetDir}/src/infrastructure/repositories/prisma/.config`;
    
        const prismaModuleContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_MODULE}`));
        const prismaServiceContent = await FsUtil.getFileContent(resolve(__dirname, `../templates/${TEMPLATE_PATH.PRISMA_SERVICE}`));
    
        const appModulePath = `${targetDir}/src/app.module.ts`;
        let appModuleContent = await FsUtil.getFileContent(appModulePath);
    
        MessageUtil.info(`Generating prisma.module in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.module.ts`, prismaModuleContent);
    
        MessageUtil.info(`Generating prisma.service in ${prismaDir}...`);
        await FsUtil.createFile(`${prismaDir}/prisma.service.ts`, prismaServiceContent);
    
        appModuleContent = await FsUtil.addImportInModuleClean(
          appModuleContent,
          `import { PrismaModule } from './infrastructure/repositories/prisma/.config/prisma.module'`,
          `PrismaModule`
        );
    
    
        await FsUtil.createFile(appModulePath, appModuleContent);
        MessageUtil.success(`PrismaModule correctly imported and registered in AppModule`);
    
       
        const packageJsonPath = join(targetDir, 'package.json');
        const packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
        const packageJson = JSON.parse(packageJsonContent);
    
        packageJson.prisma = {
          schema: "src/infrastructure/repositories/prisma/.config/schema.prisma"
        };
    
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)); // indentation
        MessageUtil.success('Added prisma.schema path to package.json');
    
        FsUtil.updateEnvExampleIfNeeded(configChoice.projectName, "DATABASE_URL", "provider://user:password@host:port/database");
      }
    
    
      /********************** FEATURED  METHOD   ******************************************************************************************************/
      static async setUpConfigFeatured(targetDir: string, configChoice: ConfigChoice) {

      
        const appModulePath = `${targetDir}/src/app.module.ts`;

        let appModuleContent = await FsUtil.getFileContent(appModulePath);
        appModuleContent = FsUtil.addImportInModuleFeatured(appModuleContent, "import { ConfigModule } from '@nestjs/config'", "ConfigModule.forRoot()")
  
    
        await FsUtil.createFile(appModulePath, appModuleContent);
    
        MessageUtil.success(`ConfigModule correctly imported and registered in AppModule`);
    
    
      }
    
    
    
      /********************** PRISMA  METHOD   ******************************** **********************************************************************/
    
      static async installConfig(targetDir: string): Promise<void> {
    
        const exec = promisify(execCb);
        MessageUtil.info('Installing Config dependencies...');
        await exec(`npm i  @nestjs/config`, {
          cwd: targetDir,
          shell: "/bin/bash"
        });
        MessageUtil.success('Config successfully installed');
      }
}