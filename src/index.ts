#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { ODM_TYPE, ORM_TYPE } from "./constants/constant";
import { InitProject } from "./scripts/initProject";
import { SetUpMongoose } from "./scripts/setUpMongoose";
import { SetUpPrisma } from "./scripts/setUpPrisma";
import { SetUpConfig } from './scripts/setUpConfigService';
import { FinalizeProject } from "./scripts/finalizeProject";
import { MessageUtil } from "./utils/message.util";

//TODO :v1 Modifier le package.json avec le nom du projet 
//TODO :v1 Gérer les espaces entre les messages
//TODO : v1 step : message fin Prisma changer le provider si besoin , modifier le schema  puis migrate dev + mongodb modifier le mongoose module
//TODO :v1 Ajout ReadMe

//TODO : v2 tester et gestions des erreurs
//TODO : v2 Ajouter des architectures
//TODO : v2 Ajouter des ORM
//TODO : v2 Pouvoir choisir son package
//TODO : v2 setUp Docker 
//TODO : v3 add new resource command



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
  }

  await SetUpConfig.exec(configChoice);
  await FinalizeProject.installDependencies();

MessageUtil.success(`\nProject ${configChoice.projectName} was successfully installed and configured.`);
  MessageUtil.info(`\n
    ${ormOrOdmMessage}

    👉  Get started with the following commands:

    $ cd ${configChoice.projectName}
    $ npm run start

    
  `);
};

 setUpProject();
