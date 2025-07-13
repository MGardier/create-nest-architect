import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
} from "../constants/constant";

export class ConfigChoice {
  projectName: string;
  architectureType: ARCHITECTURE_TYPE;
  dbLanguage: DB_LANGUAGE;
  ormOrOdm: ODM_TYPE | ORM_TYPE;

  constructor(
    projectName: string,
    architectureType: ARCHITECTURE_TYPE,
    dbLanguage: DB_LANGUAGE,
    ormOrOdm: ODM_TYPE | ORM_TYPE
  ) {
    this.projectName = projectName;
    this.architectureType = architectureType;
    this.dbLanguage = dbLanguage;
    this.ormOrOdm = ormOrOdm;
  }

  isArchitectureTypeClean(): boolean {
    return this.architectureType === ARCHITECTURE_TYPE.CLEAN;
  }

  isArchitectureTypeFeatured(): boolean {
    return this.architectureType === ARCHITECTURE_TYPE.FEATURED;
  }

  isDbLanguageSql(): boolean {
    return this.dbLanguage === DB_LANGUAGE.SQL;
  }

  isDbLanguageNoSql(): boolean {
    return this.dbLanguage === DB_LANGUAGE.NOSQL;
  }

  isOrmPrisma(): boolean {
    return this.ormOrOdm === ORM_TYPE.PRISMA;
  }

  isOdmMongoose(): boolean {
    return this.ormOrOdm === ODM_TYPE.MONGOOSE;
  }
}
