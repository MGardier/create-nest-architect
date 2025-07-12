import { ARCHITECTURE_TYPE, DB_LANGUAGE, ODM_TYPE, ORM_TYPE } from "../constant/constant";

export interface ConfigChoiceInterface {
    projectName: string;
    architectureType: ARCHITECTURE_TYPE;
    dbLanguage: DB_LANGUAGE;
    ormOrOdm: ODM_TYPE | ORM_TYPE;
}