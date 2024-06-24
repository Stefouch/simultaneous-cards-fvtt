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
  game.settings.register(MODULE_ID, SETTINGS_KEYS.ADD_CONTROL_BUTTON, {
    name: 'SETTINGS.SIMOC.AddControlButtonName',
    hint: 'SETTINGS.SIMOC.AddControlButtonHint',
    scope: 'world',
    config: true,
    requiresReload: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.SEND_REVEAL_MESSAGE, {
    name: 'SETTINGS.SIMOC.SendRevealMessageName',
    hint: 'SETTINGS.SIMOC.SendRevealMessageHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.WHISPER_REVEAL_MESSAGE, {
    name: 'SETTINGS.SIMOC.WhisperRevealMessageName',
    hint: 'SETTINGS.SIMOC.WhisperRevealMessageHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_ID, SETTINGS_KEYS.USE_ACTOR_ART_MESSAGE, {
    name: 'SETTINGS.SIMOC.UseActorArtName',
    hint: 'SETTINGS.SIMOC.UseActorArtHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
  });
}
