import { MODULE_ID, MODULE_NAME } from '@module/constants';
import { SIMOC } from '@module/config';
import CardChooser from '@module/app';

Hooks.on('init', () => {
  game.simoc = game[MODULE_ID] = {
    app: CardChooser,
    instance: null,
    config: SIMOC,
  };
  CONFIG.SIMOC = SIMOC;
});

Hooks.on('ready', () => {
  console.log(`${MODULE_NAME} | Ready!`);
  Hooks.callAll('simocReady', CONFIG.SIMOC);
  CardChooser.listen();
});
