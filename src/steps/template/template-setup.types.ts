import type { ARCHITECTURE_TYPE } from "../../config/choices";
import type { ConfigChoice } from "../../config/config.types";
import type { VirtualTreeService } from "../../services/virtual-tree.service";


export interface TemplateMeta {
  id: ARCHITECTURE_TYPE;
  repoUrl: string;
}

export interface TemplateAction {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTreeService, config: ConfigChoice) => Promise<string | void>;
}
