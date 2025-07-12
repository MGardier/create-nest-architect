#!/usr/bin/env node

import chalk from "../node_modules/chalk/source/index";
import { DB_LANGUAGE, ODM_TYPE, ORM_TYPE } from "./constant/constant";
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
  const architectureName = await UtilPrompt.askArchitecture();
  if (!architectureName) {
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
    architectureName,
    dbLanguage,
    ormOrOdm,
  }
};


async function setUpProject() {
  const configChoice: ConfigChoiceInterface = await collectProjectConfig();
  console.log(configChoice);
}

setUpProject();

