#!/usr/bin/env node

import chalk from "../node_modules/chalk/source/index";
import { UtilPrompt } from "./utils/prompt.util";

const main = async () => {
  /********************** PROJECT NAME  ******************************** */
  const projectName = await UtilPrompt.askProjectNameIfNeeded();
  if (!projectName) {
    console.error(chalk.red("❌ You must specify a name to create project."));
    process.exit(1);
  }
  /********************** ARCHITECTURE  ******************************** */
};

main();
