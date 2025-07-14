#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { InitProject } from "./scripts/initProject";


export const setUpProject = async () => {
  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();
  await InitProject.cloneRepo(configChoice);
  InitProject.setUpPrisma(configChoice);

};

setUpProject();
