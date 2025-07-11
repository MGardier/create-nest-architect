#!/usr/bin/env node

import chalk from "../node_modules/chalk/source/index";
import { DB_LANGUAGE } from "./constant/constant";
import { UtilPrompt } from "./utils/prompt.util";

const main = async (): Promise<void> => {
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

  let ormOrOdm: string =
    dbLanguage === DB_LANGUAGE.NOSQL
      ? await UtilPrompt.askOdm()
      : await UtilPrompt.askOrm();

  if (!ormOrOdm) {
    console.error(chalk.red("❌ You must choose an Orm or Odm ."));
    process.exit(1);
  }
  console.log("projectname => ", projectName);
  console.log("architectureName => ", architectureName);
  console.log("dbLanguage => ", dbLanguage);
  console.log("ormOrOdm => ", ormOrOdm);
};

main();
