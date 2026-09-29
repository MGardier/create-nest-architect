import type { MODULE_SYSTEM } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";
import type { VirtualTreeService } from "../../services/virtual-tree.service";


export interface ModuleSystemMeta {
  id: MODULE_SYSTEM;
}

/**
 * What a module system changes, as data — mirroring Step in
 * step.types.ts: one entry per unit of work, run in order by the
 * accumulator loop of module.step.ts.
 *
 * Actions only write into the tree — the pipeline commits it to disk
 * once, after the last step.
 */
export interface ModuleSystemAction {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTreeService, config: ConfigChoice) => Promise<string | void>;
}
