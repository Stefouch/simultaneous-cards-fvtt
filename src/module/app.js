import { MODULE_ID } from './constants';
import { SIMOC } from './config';
import { getTokenOwner } from '@utils/token-utils';

/**
 * @typedef {Object} CardChooserAppData
 * @property {ParticipantData[]} participants
 * @property {string} stackId
 * @property {boolean} [submitted=false]
 */

/**
 * @typedef {Object} ParticipantData
 * @property {string} token
 * @property {string} user
 * @property {string} suit
 * @property {string} card
 */

/**
 * @typedef {Object} Participant
 * @property {TokenDocument} token
 * @property {User} user
 * @property {string} suit
 * @property {Card} card
 */

/**
 * @extends {Application}
 */
export default class CardChooser extends Application {
  /**
   * @param {CardChooserAppData} data
   * @param {ApplicationOptions} options
   */
  constructor(data, options) {
    super(options);
    this.data = data;
  }

  /* ------------------------------------------ */
  /*  Properties                                */
  /* ------------------------------------------ */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'SIMOC.AppName',
      template: `modules/${MODULE_ID}/templates/app.hbs`,
      classes: [MODULE_ID, game.system.id, 'sheet'],
      id: `${MODULE_ID}-app`,
    });
  }

  /**
   * @type {Cards}
   * @readonly
   */
  get stack() {
    let stack = game.cards.get(this.data.stackId);
    if (!stack) stack = game.cards.getName(this.data.stackId);
    return stack;
  }

  /**
   * @type {Collection.<Card>}
   * @readonly
   */
  get cards() {
    return this.stack?.cards;
  }

  /**
   * @type {Collection.<Participant>}
   * @readonly
   */
  get participants() {
    const participants = this.data.participants.map(p => this.#getParticipant(p));
    return new Collection(participants.map(p => [p.token.id, p]));
  }

  /* ------------------------------------------ */
  /*  Data Preparation                          */
  /* ------------------------------------------ */

  getData() {
    const data = {};
    data.participants = this.participants.contents;
    data.isGM = game.user.isGM;
    return data;
  }

  /* ------------------------------------------ */

  /**
   * @param {ParticipantData} data
   * @returns {Participant}
   */
  #getParticipant(data) {
    const token = canvas.scene.tokens.get(data.token);
    const user = game.users.get(data.user);
    return { token, user, suit: data.suit };
  }

  /* ------------------------------------------ */
  /*  Instance Creation                         */
  /* ------------------------------------------ */

  /**
   * Creates a new instance.
   * @param {string}   [stackId] ID or name of the cards stack to use
   * @param {string[]} [suits]   Array of suits for filtering
   * @returns {Promise.<CardChooser>}
   */
  static async create(stackId, suits) {
    if (!game.user.isGM) {
      ui.notifications.warn('SIMOC.OnlyGM', { localize: true });
      return;
    }

    let stack;
    if (stackId) stack = game.cards.get(stackId);
    if (stackId && !stack) stack = game.cards.getName(stackId);
    if (!stack) stack = await this.chooseCardsStack();
    if (!suits || suits.length <= 0) suits = [...new Set(stack.cards.map(c => c.suit))];
    const participants = await this.chooseParticipants(suits);

    return new this({ stackId: stack.id, participants }).render(true);
  }

  /* ------------------------------------------ */

  /**
   * Gets a cards stack ID.
   * @returns {Promise.<Cards>}
   */
  static async chooseCardsStack() {
    const stacks = game.cards.contents;
    if (stacks.length <= 1) return stacks[0];

    const id = await Dialog.prompt({
      title: game.i18n.localize('SIMOC.ChooseStack'),
      content: await renderTemplate(SIMOC.templates.stackChooserDialog, { stacks }),
      label: 'OK',
      callback: html => html[0].querySelector('form').stack.value,
      options: { classes: [MODULE_ID, game.system.id, 'dialog', 'stack-chooser'] },
    });
    return stacks.find(s => s.id === id);
  }

  /* ------------------------------------------ */

  /**
   * Displays a dialog for the configuration of the participants.
   * @param {string[]} [suits]
   */
  static async chooseParticipants(suits) {
    /** @type {TokenDocument[]} */
    const tokens = canvas.scene.tokens;
    const selectedTokenIds = canvas.tokens.controlled.map(t => t.document.id);

    const tokenParticipants = tokens.map(t => ({
      id: t.id,
      img: t.texture.src,
      name: t.name,
      checked: selectedTokenIds.includes(t.id),
      user: getTokenOwner(t, true),
    }));

    const form = await Dialog.prompt({
      title: game.i18n.localize('SIMOC.PrepareParticipants'),
      content: await renderTemplate(SIMOC.templates.participantsConfigDialog, {
        participants: tokenParticipants,
        users: game.users
          .filter(u => u.active)
          .reduce((o, u) => { o[u.id] = u.name; return o; }, {}),
        suits,
      }),
      callback: html => html[0].querySelector('form'),
      label: game.i18n.localize('SIMOC.Start'),
      options: {
        classes: [MODULE_ID, game.system.id, 'dialog', 'participants-config'],
        width: 500,
      },
    });

    // Transforms form's data.
    /** @type {ParticipantData[]} */
    const participants = [];
    for (const { id } of tokens) {
      if (form[`${id}.checked`].checked) {
        participants.push({
          token: id,
          user: form[`${id}.user`].value,
          suit: form[`${id}.suit`].value,
        });
      }
    }

    return participants;
  }
}
