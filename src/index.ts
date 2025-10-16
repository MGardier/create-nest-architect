#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { ODM_TYPE, ORM_TYPE } from "./constants/constant";
import { PACKAGER_TYPE } from "./constants/packager.constants";
import { InitProject } from "./scripts/initProject";
import { SetUpMongoose } from "./scripts/setUpMongoose";
import { SetUpPrisma } from "./scripts/setUpPrisma";
import { SetUpConfig } from './scripts/setUpConfigService';
import { FinalizeProject } from "./scripts/finalizeProject";
import { MessageUtil } from "./utils/message.util";
import { FsUtil } from "./utils/fs.util";



export const setUpProject = async () => {

  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();

  await InitProject.cloneRepo(configChoice);

  let ormOrOdmMessage: string;
  switch (configChoice.ormOrOdm) {

    case ORM_TYPE.PRISMA: {
      ormOrOdmMessage = await SetUpPrisma.exec(configChoice);
      break;
    }

    case ODM_TYPE.MONGOOSE: {
      ormOrOdmMessage = await SetUpMongoose.exec(configChoice);
      break;
    }
    default:
      MessageUtil.error(`Unsupported ORM/ODM type: ${configChoice.ormOrOdm}`);
      process.exit(1);
  }

  await SetUpConfig.exec(configChoice);
  await FinalizeProject.exec(configChoice);

  const { packager } = configChoice;
  const startCommand = packager.run('start dev ');

  
  let pnpmMessage = '';
  if (configChoice.packagerType === PACKAGER_TYPE.PNPM) 
    pnpmMessage = `\n    ⚠️  Don't forget to approve builds with:\n    $ pnpm approve-builds\n`;
  

  MessageUtil.success(`\nProject ${FsUtil.extractProjectNameFromPath(configChoice.projectName)} was successfully installed and configured.`);
  MessageUtil.info(`\n
    ${ormOrOdmMessage}

    👉  Get started with the following commands:

    $ cd ${configChoice.projectName}${pnpmMessage}
    $ ${startCommand}


  `);
};


setUpProject();
