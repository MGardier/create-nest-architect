import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
  PACKAGER_TYPE,
} from "./choices";

/**
 * The collected configuration as plain data.
 * The ConfigChoice class (classes/configChoice.class.ts) stays alive in
 * parallel until the pipeline steps are migrated: validateConfig() builds
 * an instance of it from this data.
 */
export interface ConfigData {
  projectName: string;
  packagerType: PACKAGER_TYPE;
  architectureType: ARCHITECTURE_TYPE;
  dbLanguage: DB_LANGUAGE;
  ormOrOdm: ODM_TYPE | ORM_TYPE;
}

export type PartialConfig = Partial<ConfigData>;
