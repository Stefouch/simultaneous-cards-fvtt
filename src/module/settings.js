// ? scope: world (gm), client (player)
// ? config: true (visible)

import { MODULE_ID, SETTINGS_KEYS } from './constants.js';

export function registerSystemSettings() {

  game.settings.register(MODULE_ID, SETTINGS_KEYS.MIGRATION_VERSION, {
    name: 'Module Migration Version',
    scope: 'world',
    config: false,
    type: String,
    default: '0.0.0',
  });

  game.settings.register(MODULE_ID, SETTINGS_KEYS.FILTER_OUT_DRAWN_CARDS, {
    name: 'SETTINGS.SIMOC.FilterOutDrawnCardsName',
    hint: 'SETTINGS.SIMOC.FilterOutDrawnCardsHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
}
