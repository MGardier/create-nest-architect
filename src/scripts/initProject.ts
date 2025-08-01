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
      MessageUtil.error("An error append when try to git clone template, please check that a project does not already exist and git works.");
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
}


