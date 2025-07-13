export enum ARCHITECTURE_TYPE {
  FEATURED = "FEATURED",
  CLEAN = "CLEAN",
}

export enum DB_LANGUAGE {
  SQL = "SQL",
  NOSQL = "NOSQL",
}

export enum ORM_TYPE {
  PRISMA = "PRISMA",
}

export enum ODM_TYPE {
  MONGOOSE = "MONGOOSE",
}

export abstract class Constant {
  static REPO_TEMPLATE: Record<string, string> = {
    clean:
      "https://github.com/MGardier/create-nest-architect-template-clean.git",
    featured:
      "https://github.com/MGardier/create-nest-architect-template-featured.git",
  };

  static getKeyDisplay(key: string): string {
    switch (key) {
      case ARCHITECTURE_TYPE.CLEAN:
        return "🏛️   Clean Architecture";
      case ARCHITECTURE_TYPE.FEATURED:
        return "🏷️   Featured Architecture";
      case DB_LANGUAGE.SQL:
        return "🗃️    Sql";
      case DB_LANGUAGE.NOSQL:
        return "📦   NoSql";
      case ODM_TYPE.MONGOOSE:
        return "📦   Mongoose";
      case ORM_TYPE.PRISMA:
        return "📦   Prisma";
      default:
        return key;
    }
  }
}
