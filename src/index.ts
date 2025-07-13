#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { InitProject } from "./scripts/initProject";
import { resolve } from "path";
import { stderr } from "process";
import { promisify } from "util";
import { exec as execCb } from "child_process";

export const setUpProject = async () => {
  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();
  await InitProject.cloneRepo(configChoice);
  InitProject.setUpPrisma(configChoice);

  const targetDir = resolve(process.cwd(), configChoice.projectName);
  console.log(targetDir);
  
  const exec = promisify(execCb);
  await exec(`npm install prisma @prisma/client && npx prisma init`, {
    cwd: targetDir,
    shell: true ,
  });
};

setUpProject();
