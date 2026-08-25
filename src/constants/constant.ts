export const TEMPLATE_PATH = {
  ENV_EXAMPLE: ".env.example.template",

  prisma: {
    schema: "prisma/schema.prisma.template",
    service: "prisma/prisma.service.ts.template",
    module: "prisma/prisma.module.ts.template",
    config: "prisma/prisma.config.ts.template",
  },

  mongoose: {
    module: "mongoose/mongoose.module.ts.template",
    entity: "mongoose/mongoose.product.entity.ts.template",
  },
} as const;
