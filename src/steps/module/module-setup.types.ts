import type { MODULE_SYSTEM } from "../../config/choices";
import type { StepAction } from "../step.types";


export interface ModuleSystemMeta {
  id: MODULE_SYSTEM;
}

/** One entry per unit of work, run in order by module.step.ts. Actions only write into the tree. */
export interface ModuleSystemAction extends StepAction {}
