import { ConfigChoice } from "../classes/configChoice.class";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";




export abstract class SetUpConfig {

  /********************** EXEC METHOD   ***************************************************************************************************************/
  static async exec(configChoice: ConfigChoice): Promise<void> {
    MessageUtil.info('\nInstalling NestJs Config...');
    const targetDir = resolve(process.cwd(), configChoice.projectName);
    await this.installConfig(targetDir, configChoice);

    if (configChoice.isArchitectureTypeFeatured())
      await this.setUpConfigFeatured(targetDir);

  }


  /********************** FEATURED  METHOD   ******************************************************************************************************/
  static async setUpConfigFeatured(targetDir: string) {
    MessageUtil.info(`\nUpdating app.module...`);

    const configModule = "ConfigModule.forRoot({isGlobal: true,})";
    const configImport = "import { ConfigModule } from '@nestjs/config'"
    const appModulePath = join(targetDir, '/src/app.module.ts');

    let appModuleContent = await FsUtil.getFileContent(appModulePath);
    appModuleContent = FsUtil.addNewModuleFeatured(appModuleContent, configImport, configModule)

    await FsUtil.createFile(appModulePath, appModuleContent);
    MessageUtil.success(`AppModule correctly updated`);

  }



  /********************** INSTALLATION  METHOD   ******************************** **********************************************************************/
  static async installConfig(targetDir: string, configChoice: ConfigChoice): Promise<void> {
    const exec = promisify(execCb);
    const { packager } = configChoice;

    await exec(packager.add('@nestjs/config'), {
      cwd: targetDir,
      shell: "/bin/bash"
    });
    MessageUtil.success('Config successfully installed');

  }
}