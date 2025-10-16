import { MessageUtil } from "../utils/message.util";

import { promisify } from "util";
import { exec as execCb } from "child_process";
import { FsUtil } from "../utils/fs.util";
import { ConfigChoice } from '../classes/configChoice.class';
import { join, resolve } from "path";


export abstract class FinalizeProject {


    static async exec(configChoice: ConfigChoice): Promise<void> {
      const targetDir = resolve(process.cwd(), configChoice.projectName);
      await this.cleanPackageLockJson(targetDir, configChoice);
      await this.installDependencies(targetDir,configChoice);
      await this.removeDotGit(targetDir);

  }
  /********************** INSTALL DEPENDENCIES  ******************************** */
  static async installDependencies(targetDir: string, configChoice: ConfigChoice): Promise<void> {

    MessageUtil.info("\nInstalling dependencies...");
    const exec = promisify(execCb);
    const { packager } = configChoice;

    try {
      const { stdout, stderr } = await exec(
        packager.install, {cwd: targetDir}
      );

      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Dependencies successfully installed")
    } catch (err) {
      console.info(err)
      MessageUtil.error("An error occurred when trying to install dependencies, please do it manually.");
      process.exit(1);



    }
    const packageJsonPath = `${targetDir}/package.json`;
    let packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
    packageJsonContent=  await FsUtil.updateProjectNameInPackageJson(packageJsonContent, FsUtil.extractProjectNameFromPath(configChoice.projectName))
    await FsUtil.createFile(packageJsonPath, packageJsonContent);

  }

  /********************** CLEAN PACKAGE LOCK JSON  ******************************** */
  static async cleanPackageLockJson(targetDir: string, configChoice: ConfigChoice): Promise<void> {
    const { packager } = configChoice;

    if (packager.lockfile !== 'package-lock.json') {
      const packageLockPath = join(targetDir, 'package-lock.json');
      try {
        await FsUtil.deleteDirectory(packageLockPath);
        MessageUtil.info('Removed npm package-lock.json from template');
      } catch (err) {
      }
    }
  }

  /********************** REMOVE DOT GIT  ******************************** */
  static async removeDotGit(targetDir : string){
    await FsUtil.deleteDirectory(join(targetDir,'.git'));
  }


}


