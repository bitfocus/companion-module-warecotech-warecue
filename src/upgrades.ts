import type { CompanionStaticUpgradeScript } from '@companion-module/base'
import type { ModuleConfig, ModuleSecrets } from './config.js'

// No config migrations yet. Add scripts here if the config shape ever changes.
export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig, ModuleSecrets | undefined>[] = []
