#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { ODM_TYPE, ORM_TYPE } from "./constants/constant";
import { InitProject } from "./scripts/initProject";


export const setUpProject = async () => {
  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();
  await InitProject.cloneRepo(configChoice);
  switch(configChoice.ormOrOdm){
    case ORM_TYPE.PRISMA :{
      InitProject.setUpPrismaMerge(configChoice);
      break;
    }
    
    case ODM_TYPE.MONGOOSE : {
      InitProject.setUpMongoose(configChoice);
      break;
    }
  }
 

};

setUpProject();
