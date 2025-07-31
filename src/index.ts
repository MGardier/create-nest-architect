#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { ODM_TYPE, ORM_TYPE } from "./constants/constant";
import { InitProject } from "./scripts/initProject";
import { SetUpMongoose } from "./scripts/setUpMongoose";
import { SetUpPrisma } from "./scripts/setUpPrisma";
import { SetUpConfig } from './scripts/setUpConfigService';
import { FinalizeProject } from "./scripts/finalizeProject";
import { MessageUtil } from "./utils/message.util";

  //TODO :v1 Gérer les espaces entre les messages
  //TODO : v1 step : Prisma changer le provider si besoin , modifier le schema  puis migrate dev
  //TODO :v1 Ajout ReadMe
 
  //TODO : v2 tester et gestions des erreurs
  //TODO : v2 setUp Docker 
  //TODO : v3 add new resource command



export const setUpProject = async () => {
  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();
  await InitProject.cloneRepo(configChoice);
  switch(configChoice.ormOrOdm){
    case ORM_TYPE.PRISMA :{
      await SetUpPrisma.exec(configChoice);
      break;
    }
    
    case ODM_TYPE.MONGOOSE : {
      await SetUpMongoose.exec(configChoice);
      break;
    }
  }
 
 await SetUpConfig.exec(configChoice);
 await FinalizeProject.installDependencies();

  MessageUtil.success(`Project ${configChoice.projectName} was successfully installed and configured.
    👉  Get started with the following commands:

    $ cd test
    $ npm run start
  `);
};

setUpProject();
