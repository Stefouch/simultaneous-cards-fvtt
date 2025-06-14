/** @enum {string} */
export const MODULE_ID = 'simultaneous-cards';

/** @enum {string} */
export const MODULE_NAME = '🎴 Simultaneous Cards';

/** @enum {string} */
export const SETTINGS_KEYS = {
  /** @type {'moduleMigrationVersion'} */ MIGRATION_VERSION: 'moduleMigrationVersion',
  /** @type {'addControlButton'} */ ADD_CONTROL_BUTTON: 'addControlButton',
  /** @type {'sendRevealMessage'} */ SEND_REVEAL_MESSAGE: 'sendRevealMessage',
  /** @type {'whisperRevealMessage'} */ WHISPER_REVEAL_MESSAGE: 'whisperRevealMessage',
  /** @type {'useActorArtMessage'} */ USE_ACTOR_ART_MESSAGE: 'useActorArtMessage',
};

/** @enum {string} */
export const HOOKS_KEYS = {
  /** @type {'simultaneousCardsReady'} */ READY: 'simultaneousCardsReady',
  /** @type {'simultaneousCardsReveal'} */ REVEAL: 'simultaneousCardsReveal',
};
