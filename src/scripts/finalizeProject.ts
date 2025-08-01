import { MessageUtil } from "../utils/message.util";

import { promisify } from "util";
import { exec as execCb } from "child_process";
import { FsUtil } from "../utils/fs.util";
import { ConfigChoice } from "../classes/configChoice.class";
import { resolve } from "path";


export abstract class FinalizeProject {

  /********************** CLONE REPOSITORY  ******************************** */
  static async installDependencies(configChoice: ConfigChoice): Promise<void> {

    MessageUtil.info("\nInstall dependecies ....");
    const exec = promisify(execCb);

    try {
      const { stdout, stderr } = await exec(
        `npm i `
      );
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Depencies successfully  installed")
    } catch (err) {
      MessageUtil.error("An error append when try to install depencies, please make it manually.");
      process.exit(1);



    }
    const packageJsonPath = `${resolve(process.cwd(), configChoice.projectName)}/package.json`;
    let packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
    packageJsonContent=  await FsUtil.updateProjectNameInPackageJson(packageJsonContent, configChoice.projectName)
    await FsUtil.createFile(packageJsonPath, packageJsonContent);

  }



}


