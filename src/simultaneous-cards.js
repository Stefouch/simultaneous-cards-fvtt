import { MODULE_NAME } from '@module/constants';

Hooks.on('ready', () => {
  console.log(`${MODULE_NAME} | Ready!`);
})
