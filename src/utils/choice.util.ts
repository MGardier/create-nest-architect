import { AskChoiceInterface } from "../interfaces/askChoice.interface";
import {
  ARCHITECTURE_TYPE,
  Constant,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
} from "../constants/constant";

export abstract class ChoiceUtil {
  static getArchitectureChoices(): AskChoiceInterface[] {
    const clean: AskChoiceInterface = {
      title: Constant.getKeyDisplay(ARCHITECTURE_TYPE.CLEAN),
      value: ARCHITECTURE_TYPE.CLEAN,
    };
    const featured: AskChoiceInterface = {
      title: Constant.getKeyDisplay(ARCHITECTURE_TYPE.FEATURED),
      value: ARCHITECTURE_TYPE.FEATURED,
    };
    return [featured, clean];
  }

  static getDbLanguageChoices(): AskChoiceInterface[] {
    const sql: AskChoiceInterface = {
      title: Constant.getKeyDisplay(DB_LANGUAGE.SQL),
      value: DB_LANGUAGE.SQL,
    };
    const noSql: AskChoiceInterface = {
      title: Constant.getKeyDisplay(DB_LANGUAGE.NOSQL),
      value: DB_LANGUAGE.NOSQL,
    };
    return [sql, noSql];
  }

  static getOrmChoices(): AskChoiceInterface[] {
    const prisma: AskChoiceInterface = {
      title: Constant.getKeyDisplay(ORM_TYPE.PRISMA),
      value: ORM_TYPE.PRISMA,
    };
    return [prisma];
  }

  static getOdmChoices(): AskChoiceInterface[] {
    const mongoose: AskChoiceInterface = {
      title: Constant.getKeyDisplay(ODM_TYPE.MONGOOSE),
      value: ODM_TYPE.MONGOOSE,
    };
    return [mongoose];
  }
}
