import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
} from "../constants/constant";
import {
  PACKAGER_TYPE,
  IPackagerCommands,
  PackagerFactory,
} from "../constants/packager.constants";

export class ConfigChoice {
  projectName: string;
  packagerType: PACKAGER_TYPE;
  architectureType: ARCHITECTURE_TYPE;
  dbLanguage: DB_LANGUAGE;
  ormOrOdm: ODM_TYPE | ORM_TYPE;

//TODO: Changer la façon de récupérer la db et l'architecture en optimisant .

  private _packagerCommands?: IPackagerCommands;

  constructor(
    projectName: string,
    packagerType: PACKAGER_TYPE,
    architectureType: ARCHITECTURE_TYPE,
    dbLanguage: DB_LANGUAGE,
    ormOrOdm: ODM_TYPE | ORM_TYPE
  ) {
    this.projectName = projectName;
    this.packagerType = packagerType;
    this.architectureType = architectureType;
    this.dbLanguage = dbLanguage;
    this.ormOrOdm = ormOrOdm;
  }

  get packager(): IPackagerCommands {
    if (!this._packagerCommands) {
      this._packagerCommands = PackagerFactory.getCommands(this.packagerType);
    }
    return this._packagerCommands;
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
