export const TEMPLATE_PATH = {
  /** One compose file per database, read as-is: no placeholder, the values come from .env. */
  database: {
    postgresql: "database/postgresql.compose.yaml.template",
  },

  /** Jest's configuration, for a CommonJS project. */
  module: {
    cjs: {
      jestConfig: "module/cjs/jest.config.ts.template",
      jestE2e: "module/cjs/jest-e2e.json.template",
    },
  },

  prisma: {
    schema: "prisma/schema.prisma.template",
    service: "prisma/prisma.service.ts.template",
    module: "prisma/prisma.module.ts.template",
    config: "prisma/prisma.config.ts.template",

    /** The POST /users example, written for architecture. */
    example: {
      model: "prisma/example/user.model.prisma.template",
      featured: {
        dto: "prisma/example/featured/create-user.dto.ts.template",
        service: "prisma/example/featured/user.service.ts.template",
        controller: "prisma/example/featured/user.controller.ts.template",
        module: "prisma/example/featured/user.module.ts.template",
      },
    },
  },

  mongoose: {
    /** The connection module, shared by both architectures. */
    database: "mongoose/database.module.ts.template",

    /** Featured keeps the whole example in one feature folder. */
    featured: {
      entity: "mongoose/example/featured/product.entity.ts.template",
      dto: "mongoose/example/featured/create-product.dto.ts.template",
      service: "mongoose/example/featured/product.service.ts.template",
      controller: "mongoose/example/featured/product.controller.ts.template",
      module: "mongoose/example/featured/product.module.ts.template",
    },

    /** Clean spreads the same example across its four layers. */
    clean: {
      entity: "mongoose/example/clean/product.entity.ts.template",
      repository: "mongoose/example/clean/product.repository.ts.template",
      useCase: "mongoose/example/clean/create-product.use-case.ts.template",
      schema: "mongoose/example/clean/product.schema.ts.template",
      mongooseRepository: "mongoose/example/clean/product.mongoose.repository.ts.template",
      dto: "mongoose/example/clean/create-product.dto.ts.template",
      controller: "mongoose/example/clean/product.controller.ts.template",
      module: "mongoose/example/clean/product.module.ts.template",
    },
  },
} as const;
