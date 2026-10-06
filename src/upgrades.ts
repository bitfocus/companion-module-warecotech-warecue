import type { CompanionStaticUpgradeScript } from '@companion-module/base'
import type { ModuleConfig } from './config'

// No config migrations yet. Add scripts here if the config shape ever changes.
export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = []
