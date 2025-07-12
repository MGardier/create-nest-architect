#!/usr/bin/env node

import { exec } from "child_process";
import chalk from "../node_modules/chalk/source/index";
import { ARCHITECTURE_TYPE, Constant, DB_LANGUAGE, ODM_TYPE, ORM_TYPE } from "./constant/constant";
import { ConfigChoiceInterface } from "./interfaces/configChoice.interface";
import { UtilPrompt } from "./utils/prompt.util";

const collectProjectConfig = async (): Promise<ConfigChoiceInterface> => {
  /********************** PROJECT NAME  ******************************** */
  const projectName = await UtilPrompt.askProjectNameIfNeeded();
  if (!projectName) {
    console.error(chalk.red("❌ You must specify a name to create project."));
    process.exit(1);
  }
  /********************** ARCHITECTURE  ******************************** */
  const architectureType = await UtilPrompt.askArchitecture();
  if (!architectureType) {
    console.error(chalk.red("❌ You must choose an architecture."));
    process.exit(1);
  }

  /********************** DB LANGUAGE  ******************************** */
  const dbLanguage = await UtilPrompt.askDbLanguage();
  if (!dbLanguage) {
    console.error(chalk.red("❌ You must choose an architecture."));
    process.exit(1);
  }

  /********************** ORM or ODM  ******************************** */
  let ormOrOdm: ORM_TYPE | ODM_TYPE =
    dbLanguage === DB_LANGUAGE.NOSQL
      ? await UtilPrompt.askOdm()
      : await UtilPrompt.askOrm();

  if (!ormOrOdm) {
    console.error(chalk.red("❌ You must choose an Orm or Odm ."));
    process.exit(1);
  }

  return {
    projectName,
    architectureType,
    dbLanguage,
    ormOrOdm,
  }
};

async function cloneRepo(configChoice: ConfigChoiceInterface) {
  const templates: Record<string, string> = Constant.REPO_TEMPLATE;
  const templateRepo: string = configChoice.architectureType === ARCHITECTURE_TYPE.CLEAN ? templates.clean : templates.featured;
  const projectName: string = configChoice.projectName;

  exec(`git clone --depth 1 --branch main ${templateRepo} ${projectName}`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${stderr}`);
      process.exit(1);
    }

    console.log(chalk.green(stdout));
    console.log(chalk.green(`Project created successfully in ${projectName}`));
  });
}


async function setUpProject() {
  const configChoice: ConfigChoiceInterface = await collectProjectConfig();
  console.log(configChoice);
  cloneRepo(configChoice)
}

setUpProject();

