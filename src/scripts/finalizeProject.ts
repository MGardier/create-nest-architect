import { MessageUtil } from "../utils/message.util";

import { promisify } from "util";
import { exec as execCb } from "child_process";
import { FsUtil } from "../utils/fs.util";
import { ConfigChoice } from '../classes/configChoice.class';
import { join, resolve } from "path";


export abstract class FinalizeProject {


    static async exec(configChoice: ConfigChoice): Promise<void> {
      const targetDir = resolve(process.cwd(), configChoice.projectName);
      await this.installDependencies(targetDir,configChoice);
      await this.removeDotGit(targetDir);

  }
  /********************** CLONE REPOSITORY  ******************************** */
  static async installDependencies(targetDir: string, configChoice: ConfigChoice): Promise<void> {



    MessageUtil.info("\nInstall dependecies ....");
    const exec = promisify(execCb);
    try {
      const { stdout, stderr } = await exec(
        `npm i `, {cwd: targetDir}
      );
      
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Dependencies successfully  installed")
    } catch (err) {
      console.info(err)
      MessageUtil.error("An error occurred when try to install dependencies, please make it manually.");
      process.exit(1);



    }
    const packageJsonPath = `${targetDir}/package.json`;
    let packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
    packageJsonContent=  await FsUtil.updateProjectNameInPackageJson(packageJsonContent, configChoice.projectName)
    await FsUtil.createFile(packageJsonPath, packageJsonContent);

  }

  static async removeDotGit(targetDir : string){
    await FsUtil.deleteDirectory(join(targetDir,'.git'));
  }


}


