import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import {  resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";



//TODO: add config in app module 
//TODO: add example in a service in constructor + add line 



export abstract class SetUpConfig {

  /********************** EXEC METHOD   ***************************************************************************************************************/
  static async exec(configChoice: ConfigChoice): Promise<void> {
    const targetDir = resolve(process.cwd(), configChoice.projectName);

    await this.installConfig(targetDir);

    if (configChoice.isArchitectureTypeClean()) {
      await this.setUpConfigClean(targetDir, configChoice);
    }
    else {
      await this.setUpConfigFeatured(targetDir);
    }
  }


  /********************** CLEAN METHOD    *********************************************************************************************************/
  static async setUpConfigClean(targetDir: string, configChoice: ConfigChoice): Promise<void> {
    const moduleImport = "ConfigModule.forRoot({isGlobal: true,})";
    const appModulePath = `${targetDir}/src/app.module.ts`;

  }


  /********************** FEATURED  METHOD   ******************************************************************************************************/
  static async setUpConfigFeatured(targetDir: string) {

    const moduleImport = "ConfigModule.forRoot({isGlobal: true,})";
    const appModulePath = `${targetDir}/src/app.module.ts`;

    let appModuleContent = await FsUtil.getFileContent(appModulePath);
    appModuleContent = FsUtil.addNewModuleFeatured(appModuleContent, "import { ConfigModule } from '@nestjs/config'", moduleImport)

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