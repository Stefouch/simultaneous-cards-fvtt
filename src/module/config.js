import { MODULE_ID } from './constants';

export const SIMOC = {};

SIMOC.templates = {
  app: `modules/${MODULE_ID}/templates/app.hbs`,
  participantsConfigDialog: `modules/${MODULE_ID}/templates/participants-config-dialog.hbs`,
};

SIMOC.icons = {
  drawcard: 'fa-solid fa-cards-blank',
  nocard: 'fa-solid fa-xmark',
};
