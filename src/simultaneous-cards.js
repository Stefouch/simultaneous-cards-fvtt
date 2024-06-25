import { MODULE_ID, MODULE_NAME, SETTINGS_KEYS } from '@module/constants';
import { SIMOC } from '@module/config';
import CardChooser from '@module/app';
import { registerSystemSettings } from '@module/settings';

Hooks.on('init', () => {
  game.simoc = game[MODULE_ID] = {
    app: CardChooser,
    instance: null,
    config: SIMOC,
  };
  CONFIG.SIMOC = SIMOC;

  registerSystemSettings();
});

Hooks.on('ready', () => {
  console.log(`${MODULE_NAME} | Ready!`);
  Hooks.callAll('simocReady', CONFIG.SIMOC);
  CardChooser.listen();
});

Hooks.on('getSceneControlButtons', controls => {
  if (game.user.isGM && game.settings.get(MODULE_ID, SETTINGS_KEYS.ADD_CONTROL_BUTTON)) {
    const tokenControls = controls.find(c => c.name === 'token');
    tokenControls.tools.push({
      name: `${MODULE_ID}.create`,
      icon: 'fa-solid fa-cards',
      title: 'SIMOC.AppName',
      onClick: () => CardChooser.create(),
      button: true,
    });
  }
});
