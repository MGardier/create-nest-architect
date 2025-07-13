import {
  ARCHITECTURE_TYPE,
  Constant,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
} from "../constants/constant";

import { PromptUtil } from "../utils/prompt.util";
import { MessageUtil } from "../utils/message.util";
import { ConfigChoice } from "../classes/configChoice.class";
import { promisify } from "util";
import { exec as execCb } from "child_process";

export abstract class InitProject {
  static async cloneRepo(configChoice: ConfigChoice): Promise<void> {
    const templates: Record<string, string> = Constant.REPO_TEMPLATE;
    const templateRepo: string =
      configChoice.architectureType === ARCHITECTURE_TYPE.CLEAN
        ? templates.clean
        : templates.featured;
    const projectName: string = configChoice.projectName;

    const exec = promisify(execCb);

    try {
      const { stdout, stderr } = await exec(
        `git clone --depth 1 --branch main ${templateRepo} ${projectName}`
        // (err, stderr) => {
        //   if (err) {
        //     MessageUtil.error(`Error: ${stderr}`);
        //     process.exit(1);
        //   }
        //   MessageUtil.success(`Project created successfully in ${projectName}`);
        // }
      );
      console.log(stdout);
      if (stderr) console.error(stderr);
      console.log("Clonage terminé avec succès !");
    } catch (err) {
      console.error("Erreur lors de l'installation Prisma :", err);
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
    if (configChoice.isArchitectureTypeClean()) {
    } else {
      //executer npm i prisma
      // installer client prisma : npm install @prisma/client
      //executer prisma init : npx prisma  init
      //Créer prisma service + prisma module
      //ajout db url .env.example
    }
    //prisma sevice, schema prisma , prisma module ,.env.example avec db url
    //traitement prisma
  }
}
