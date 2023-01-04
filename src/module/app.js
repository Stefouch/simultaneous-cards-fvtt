import { MODULE_ID, MODULE_NAME, SETTINGS_KEYS } from './constants';
import { SIMOC } from './config';
import { chooseCard, chooseCardsStack, getCardsStack } from '@utils/cards-util';
import { getTokenOwner } from '@utils/token-utils';

/**
 * @typedef {Object} CardChooserAppData
 * @property {ParticipantData[]} participants
 * @property {boolean}          [validated=false]
 */

/**
 * @typedef {Object} ParticipantData
 * @property {string}   token
 * @property {string}   user
 * @property {string}   stack
 * @property {string}  [card]
 * @property {boolean} [revealed=false]
 */

/**
 * @typedef {Object} Participant
 * @property {string}        id      The token's ID (read-only)
 * @property {TokenDocument} token
 * @property {User}          user
 * @property {Cards}         stack
 * @property {boolean}       isOwner
 * @property {boolean}      [revealed=false]
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
    if (this.constructor._instance) {
      ui.notifications.error('SIMOC.Notif.InstanceError', { localize: true });
      throw new Error(`${MODULE_NAME} | An instance already exists!`);
    }
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
      // width: 720,
      // height: 550,
    });
  }

  /* ------------------------------------------ */

  static set _instance(instance) {
    if (!instance) console.log(`${MODULE_NAME} | Instance destroyed!`);
    else console.log(`${MODULE_NAME} | Instance created!`);
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
      /** @type {'validate'} */ validate: 'validate',
      /** @type {'reveal'} */ reveal: 'reveal',
      /** @type {'close'} */ close: 'close',
    };
  }

  /* ------------------------------------------ */

  get validated() {
    return !!this.data.validated;
  }

  /**
   * @type {Collection.<Participant>}
   * @readonly
   */
  get participants() {
    const participants = this.data.participants.map(p => this.#createParticipant(p));
    return new Collection(participants.map(p => [p.id, p]));
  }

  /* ------------------------------------------ */
  /*  Data Preparation                          */
  /* ------------------------------------------ */

  getData() {
    const data = {
      participants: this.participants.contents,
      isGM: game.user.isGM,
      isUnlocked: !this.validated,
      isReady: this.data.participants.every(p => Boolean(p.card)),
      isAllRevealed: this.data.participants.every(p => p.revealed),
      config: SIMOC,
    };
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
    // const isOwner = game.user.id === user.id;
    return {
      token, user, stack, card,
      revealed: !!data.revealed,
      get id() { return this.token.id; },
      get isOwner() { return this.user.id === game.user.id; },
    };
  }

  /* ------------------------------------------ */
  /*  Event Listeners                           */
  /* ------------------------------------------ */

  /** @param {JQuery.<HTMLElement>} html */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.card.clickable').on('click', this._onCardChoose.bind(this));
    html.find('button[data-action]').on('click', this._onButtonAction.bind(this));
  }

  async _onCardChoose(event) {
    event.preventDefault();
    if (this.validated) return;

    const id = event.currentTarget.closest('.participant').dataset.participantId;
    const participant = this.participants.get(id);

    const card = await chooseCard(participant.stack.cards.contents, {
      title: `${participant.token.name}: ${game.i18n.localize('SIMOC.ChooseCard')}`,
      description: game.i18n.localize('SIMOC.ChooseCardHint'),
    });

    if (!card) return;
    this.constructor.sendUpdate(id, { card: card.id });
    this.updateParticipant(id, { card: card.id });
  }

  _onButtonAction(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    switch (btn.dataset.action) {
      case 'reveal': return this._onRevealAction(event);
      case 'reveal-all': return this._onRevealAllAction();
      case 'validate': return this._onValidateAction();
      case 'close': return this.close();
    }
  }

  _onRevealAction(event) {
    const id = event.currentTarget.closest('.participant').dataset.participantId;
    if (this.participants.get(id).revealed) return;
    this.constructor.sendReveal(id);
    this.updateParticipant(id, { revealed: true });
    if (game.settings.get(MODULE_ID, SETTINGS_KEYS.SEND_REVEAL_MESSAGE)) {
      this.createMessage(id);
    }
  }

  _onRevealAllAction() {
    for (const p of this.data.participants) {
      if (!p.revealed) {
        this.constructor.sendReveal(p.token);
        this.createMessage(p.token);
        p.revealed = true;
      }
    }
    this.render(true);
  }

  _onValidateAction() {
    if (this.validated) return;
    this.constructor.validateInstance();
    this.data.validated = true;
    this.render(true);
  }

  /* ------------------------------------------ */
  /*  Utility Methods                           */
  /* ------------------------------------------ */

  /**
   * Updates a participant with new data.
   * @param {string} participantId ID of the participant to update
   * @param {ParticipantData} updateData Update data
   * @returns {this}
   */
  updateParticipant(participantId, updateData) {
    const participant = this.data.participants.find(p => p.token === participantId);
    for (const [k, v] of Object.entries(updateData)) {
      participant[k] = v;
    }
    return this.render(true);
  }

  /* ------------------------------------------ */

  /**
   * Sends a message with the selected card for the specified participant.
   * @param {string} participantId
   * @returns {Promise.<ChatMessage>}
   */
  async createMessage(participantId) {
    const p = this.participants.get(participantId);
    const card = p.card;
    const chatData = {
      flavor: 'dadada',
      speaker: ChatMessage.getSpeaker({
        token: p.token,
        actor: p.token.actor,
        scene: p.token.scene,
      }),
      user: p.user.id,
    };
    if (game.settings.get(MODULE_ID, SETTINGS_KEYS.WHISPER_REVEAL_MESSAGE)) {
      chatData.whisper = [...new Set(this.data.participants.map(pp => pp.user))];
    }
    // ChatMessage.applyRollMode(chatData, game.settings.get('core', 'rollMode'));
    return card.toMessage(chatData);
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
      .filter(stack => stack?.cards.size > 0);

    if (!stacks.length) stacks = game.cards.filter(stack => stack.cards.size > 0);
    if (!stacks.length) {
      ui.notifications.error('SIMOC.Notif.StackError', { localize: true, permanent: true });
      return;
    }

    const defaultStack = await chooseCardsStack(stacks, {
      title: game.i18n.localize('SIMOC.ChooseStack'),
    });

    const participants = await this.configureParticipants(stacks, defaultStack?.id);

    if (!participants.length) {
      ui.notifications.warn('SIMOC.Notif.ParticipantError', { localize: true });
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
  static async configureParticipants(stacks, defaultStackId) {
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
  /*  Other Methods                             */
  /* ------------------------------------------ */

  /** @override */
  async close(options) {
    if (game.user.isGM) {
      this.constructor.closeInstance();
      this.constructor._instance = null;
    }
    return super.close(options);
  }

  /* ------------------------------------------ */
  /*  Socket Operations                         */
  /* ------------------------------------------ */

  /**
   * Emits some data.
   * @param {string}  event
   * @param {Object} [data]
   */
  static emit(event, data = {}) {
    console.log(`${MODULE_NAME} | ${event.capitalize()}`, data);
    return game.socket.emit(this.socket, { ...data, event });
  }

  static startInstance(participants) {
    return this.emit(this.socketEvents.start, {
      gm: game.user.name,
      participants,
    });
  }

  static closeInstance() {
    return this.emit(this.socketEvents.close, {
      gm: game.user.name,
    });
  }

  static validateInstance() {
    return this.emit(this.socketEvents.validate, {
      gm: game.user.name,
    });
  }

  static sendUpdate(participantId, updateData) {
    return this.emit(this.socketEvents.update, {
      participant: participantId,
      updateData,
    });
  }

  static sendReveal(participantId) {
    return this.emit(this.socketEvents.reveal, {
      participant: participantId,
      by: game.user.name,
    });
  }

  /* ------------------------------------------ */

  static listen() {
    game.socket.on(this.socket, data => {
      console.log(`${MODULE_NAME} | Event Inbound: ${data.event.capitalize()}`);
      let message;

      switch (data.event) {
        // Start
        case this.socketEvents.start: {
          const users = data.participants.map(p => p.user);
          if(users.includes(game.user.id)) {
            new this({ participants: data.participants }).render(true);
            message = game.i18n.format('SIMOC.Notif.StartInstance', {
              name: `<b>${data.gm}</b>`,
            });
          }
          break;
        }
        // Update
        case this.socketEvents.update: {
          if (!this._instance) return;
          if (this._instance.validated) return;
          this._instance.updateParticipant(data.participant, data.updateData);
          this._instance.render(true);
          message = game.i18n.format('SIMOC.Notif.UpdateInstance', {
            name: `<b>${this._instance.participants.get(data.participant)?.user?.name}</b>`,
            participant: `<b>${this._instance.participants.get(data.participant).token.name}</b>`,
          });
          break;
        }
        // Validate
        case this.socketEvents.validate: {
          if (!this._instance) return;
          this._instance.data.validated = true;
          this._instance.render(true);
          message = game.i18n.format('SIMOC.Notif.ValidateInstance', {
            name: `<b>${data.gm}</b>`,
          });
          break;
        }
        // Reveal
        case this.socketEvents.reveal: {
          if (!this._instance) return;
          const p = this._instance.participants.get(data.participant);
          if (p.revealed) return;
          this._instance.updateParticipant(data.participant, { revealed: true });
          message = game.i18n.format('SIMOC.Notif.RevealCard', {
            name: `<b>${data.by}</b>`,
            participant: `<b>${p.token.name}</b>`,
            card:`<b>${p.card.name}</b>`,
          });
          break;
        }
        // Close
        case this.socketEvents.close: {
          if (!this._instance) return;
          this._instance.close();
          this._instance = null;
          message = game.i18n.format('SIMOC.Notif.CloseInstance', {
            name: `<b>${data.gm}</b>`,
          });
          break;
        }
      }
      if (message) ui.notifications.info(message);
    });
  }
}
