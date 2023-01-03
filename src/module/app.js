import { MODULE_ID, MODULE_NAME } from './constants';
import { SIMOC } from './config';
import { chooseCard, chooseCardsStack, getCardsStack } from '@utils/cards-util';
import { getTokenOwner } from '@utils/token-utils';

/**
 * @typedef {Object} CardChooserAppData
 * @property {ParticipantData[]} participants
 */

/**
 * @typedef {Object} ParticipantData
 * @property {string}  token
 * @property {string}  user
 * @property {string}  stack
 * @property {string} [card]
 */

/**
 * @typedef {Object} Participant
 * @property {TokenDocument} token
 * @property {User}          user
 * @property {Cards}         stack
 * @property {boolean}       isOwner
 * @property {Card}         [card]
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
    if (this.constructor._instance) throw new Error(`${MODULE_NAME} | An instance already exists!`);
    this.constructor._instance = this;
  }

  /* ------------------------------------------ */
  /*  Properties                                */
  /* ------------------------------------------ */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: 'SIMOC.AppName',
      template: SIMOC.templates.app,
      classes: [MODULE_ID, game.system.id, 'sheet'],
      id: `${MODULE_ID}-app`,
      width: 720,
      height: 550,
    });
  }

  /* ------------------------------------------ */

  static set _instance(instance) {
    game[MODULE_ID].instance = instance;
  }

  /** @type {CardChooser} */
  static get _instance() {
    return game[MODULE_ID].instance;
  }

  /* ------------------------------------------ */

  static get socket() {
    return `module.${MODULE_ID}`;
  }

  static get socketEvents() {
    return {
      /** @type {'start'} */ start: 'start',
      /** @type {'update'} */ update: 'update',
    };
  }

  /* ------------------------------------------ */

  /**
   * @type {Collection.<Participant>}
   * @readonly
   */
  get participants() {
    const participants = this.data.participants.map(p => this.#createParticipant(p));
    return new Collection(participants.map(p => [p.token.id, p]));
  }

  /* ------------------------------------------ */
  /*  Data Preparation                          */
  /* ------------------------------------------ */

  getData() {
    const data = {};
    data.participants = this.participants.contents;
    data.isGM = game.user.isGM;
    data.config = SIMOC;
    return data;
  }

  /* ------------------------------------------ */

  /**
   * @param {ParticipantData} data
   * @returns {Participant}
   */
  #createParticipant(data) {
    const token = canvas.scene.tokens.get(data.token);
    const user = game.users.get(data.user);
    const stack = game.cards.get(data.stack);
    const card = stack.cards.get(data.card);
    const isOwner = game.user.id === user.id;
    return { token, user, stack, card, isOwner };
  }

  /* ------------------------------------------ */
  /*  Event Listeners                           */
  /* ------------------------------------------ */

  /** @param {JQuery.<HTMLElement>} html */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.participant .card.clickable').on('click', this._onCardChoose.bind(this));
  }

  async _onCardChoose(event) {
    event.preventDefault();
    const id = event.currentTarget.closest('.participant').dataset.participantId;
    const participant = this.participants.get(id);

    const card = await chooseCard(participant.stack.cards.contents);

    this.updateCard(id, card.id);
    this.constructor.sendUpdate(id, card.id);

    // TODO dialog choose card
    // TODO update app
  }

  /* ------------------------------------------ */
  /*  Utility Methods                           */
  /* ------------------------------------------ */

  updateCard(participantId, cardId) {
    this.data.participants.find(p => p.token === participantId).card = cardId;
    return this.render(true);
  }

  /* ------------------------------------------ */
  /*  Instance Creation                         */
  /* ------------------------------------------ */

  /**
   * Creates a new instance.
   * @param {string|string[]} [stackIds] Array of IDs or names of the cards stacks to use
   * @returns {Promise.<CardChooser>}
   */
  static async create(stackIds) {
    if (!game.user.isGM) {
      ui.notifications.warn('SIMOC.OnlyGM', { localize: true });
      return;
    }
    if (!Array.isArray(stackIds)) stackIds = [stackIds];

    let stacks = stackIds
      .map(id => getCardsStack(id))
      .filter(Boolean);

    if (!stacks.length) stacks = game.cards.contents;

    const defaultStack = await chooseCardsStack(stacks, {
      title: game.i18n.localize('SIMOC.ChooseStack'),
    });

    const participants = await this.chooseParticipants(stacks, defaultStack?.id);

    if (!participants.length) {
      ui.notifications.warn();
      return;
    }

    this.startInstance(participants);

    return new this({ participants }).render(true);
  }

  /* ------------------------------------------ */

  /**
   * Displays a dialog for the configuration of the participants.
   * @param {Cards[]}  stacks
   * @param {string}  [defaultStackId]
   * @returns {Promise.<ParticipantData[]>}
   */
  static async chooseParticipants(stacks, defaultStackId) {
    /** @type {Collection.<TokenDocument>} */
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
        stacks: stacks.reduce((o, d) => { o[d.id] = d.name; return o; }, {}),
        defaultStackId,
        config: SIMOC,
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
          stack: form[`${id}.stack`].value,
        });
      }
    }

    return participants;
  }

  /* ------------------------------------------ */
  /*  Socket Operations                         */
  /* ------------------------------------------ */

  static startInstance(participants) {
    console.log(`${MODULE_NAME} | Start`, participants);
    game.socket.emit(this.socket, {
      event: this.socketEvents.start,
      leader: game.user.id,
      participants,
    });
  }

  static sendUpdate(participantId, cardId) {
    console.log(`${MODULE_NAME} | Update`, participantId);
    game.socket.emit(this.socket, {
      event: this.socketEvents.update,
      participant: participantId,
      card: cardId,
    });
  }

  static listen() {
    game.socket.on(this.socket, data => {
      console.log(`${MODULE_NAME} | Event: ${data.event.capitalize()}`);
      let message;

      switch (data.event) {
        case this.socketEvents.start: {
          const users = data.participants.map(p => p.user);
          if(users.includes(game.user.id)) {
            new this({ participants: data.participants }).render(true);
            message = game.i18n.format('SIMOC.Notif.StartInstance', {
              name: `<b>${game.users.get(data.leader).name}</b>`,
            });
          }
          break;
        }
        case this.socketEvents.update: {
          if (!this._instance) return;
          this._instance.updateCard(data.participant, data.card);
          this._instance.render(true);
          message = game.i18n.format('SIMOC.Notif.UpdateInstance', {
            name: `<b>${this._instance.participants.get(data.participant)?.user?.name}</b>`,
          });
          break;
        }
      }
      if (message) ui.notifications.info(message);
    });
  }
}
