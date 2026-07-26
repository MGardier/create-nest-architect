export {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ORM_TYPE,
  ODM_TYPE,
} from "../config/choices";

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
