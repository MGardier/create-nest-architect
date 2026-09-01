export const TEMPLATE_PATH = {
  ENV_EXAMPLE: ".env.example.template",

  prisma: {
    schema: "prisma/schema.prisma.template",
    service: "prisma/prisma.service.ts.template",
    module: "prisma/prisma.module.ts.template",
    config: "prisma/prisma.config.ts.template",
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
