import { findOrmInstaller } from "./orm/registry";
import type { Step } from "./step.types";

export const ormStep: Step = {
  name: "orm",
  // validate already guaranteed the installer exists
  run: (tree, config) => findOrmInstaller(config.orm)!.run(tree, config),
};
