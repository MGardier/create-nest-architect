import {
  ARCHITECTURE_TYPE,
  REPO_TEMPLATE_URL,
} from "../constants/constant";
import { MessageUtil } from "../utils/message.util";
import { ConfigChoice } from "../classes/configChoice.class";
import { promisify } from "util";
import { exec as execCb } from "child_process";


export abstract class InitProject {

    /********************** CLONE REPOSITORY  ******************************** */
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
      console.log(err)
      MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
      process.exit(1);
    }
  }
}
