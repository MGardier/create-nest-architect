import type { MODULE_SYSTEM } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";
import type { VirtualTreeService } from "../../services/virtual-tree.service";


export interface ModuleSystemMeta {
  id: MODULE_SYSTEM;
}

/** One entry per unit of work, run in order by module.step.ts. Actions only write into the tree. */
export interface ModuleSystemAction {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTreeService, config: ConfigChoice) => Promise<string | void>;
}
