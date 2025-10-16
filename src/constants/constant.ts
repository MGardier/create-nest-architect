import { PACKAGER_TYPE } from "./packager.constants";

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
export enum TEMPLATE_PATH {
  PRISMA_SERVICE = "prisma/prisma.service.ts.template",
  PRISMA_MODULE = "prisma/prisma.module.ts.template",
  PRISMA_CONFIG = "prisma/prisma.config.ts.template",
  MONGOOSE_MODULE = "mongoose/mongoose.module.ts.template",
  MONGOOSE_ENTITY = "mongoose/mongoose.product.entity.ts.template",
  ENV_EXAMPLE = '.env.example.template'
}


export enum REPO_TEMPLATE_URL {
  CLEAN = "https://github.com/MGardier/create-nest-architect-template-clean.git",
  FEATURED = "https://github.com/MGardier/create-nest-architect-template-featured.git",

}



export abstract class Constant {

  static getKeyDisplay(key: string): string {
    switch (key) {

      /**** ARCHITECTURE ******/
      case ARCHITECTURE_TYPE.CLEAN:
        return "🏛️   Clean Architecture";
      case ARCHITECTURE_TYPE.FEATURED:
        return "🏷️   Featured Architecture";

      /**** DB ******/
      case DB_LANGUAGE.SQL:
        return "🗃️    Sql";
      case DB_LANGUAGE.NOSQL:
        return "📦   NoSql";

      /**** ORM & ODM ******/
      case ODM_TYPE.MONGOOSE:
        return "📦   Mongoose";
      case ORM_TYPE.PRISMA:
        return "📦   Prisma";

      /**** PACKAGER ******/
      case PACKAGER_TYPE.NPM:
        return "📦   npm";
      case PACKAGER_TYPE.PNPM:
        return "⚡   pnpm";
      case PACKAGER_TYPE.YARN:
        return "🧶   Yarn";
      case PACKAGER_TYPE.BUN:
        return "🍞   Bun";
      default:
        return key;
    }
  }

}
