import { SIMOC } from '@module/config';
import { MODULE_ID } from '@module/constants';

/**
 * Gets a cards stack.
 * @param {string} idOrName
 * @returns {Cards}
 */
export function getCardsStack(idOrName) {
  return game.cards.find(stack => stack.id === idOrName || stack.name === idOrName || stack.name.includes(idOrName));
}

/**
 * Displays a dialog for choosing a card.
 * @param {Cards[]} cards
 * @param {Object} [options]
 * @param {string} [options.title='Choose a Card'] Title of the dialog
 * @param {string} [options.description] Additional description added on top
 */

export async function chooseCard(cards, options = {}) {
  if (cards.length <= 1) return cards[0];

  const content = await foundry.applications.handlebars.renderTemplate(SIMOC.templates.cardChooserDialog, {
    cards,
    description: options.description,
    config: SIMOC,
  });

  const id = await foundry.applications.api.DialogV2.prompt({
    window: {
      title: options.title ?? 'Choose a Card',
      resizable: true,
    },
    position: {
      width: 600,
    },
    content,
    ok: {
      callback: (event, button) => button.form.elements.card.value,
    },
    render: (event, dialog) => {
      dialog.element.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('click', () => {
          dialog.element.querySelector('button[data-action="ok"]')?.click();
        });
      });
    },
    rejectClose: false,
    classes: [MODULE_ID, game.system.id, 'dialog', 'card-chooser'],
  });

  return cards.find(c => c.id === id);
}

/**
 * Displays a dialog for choosing a cards stack.
 * @param {Cards[]} [stacks]
 * @param {Object}  [options] Additional options for the dialog
 * @param {string}  [options.title='Choose a Deck'] Title of the dialog
 * @param {string}  [options.label='OK'] Label of the button
 * @returns {Promise.<Cards>}
 */
export async function chooseCardsStack(stacks, options = {}) {
  if (stacks.length <= 1) return stacks[0];

  const selectOptions = stacks.map(d => `<option value="${d.id}">${d.name}</option>`);

  const content = `
<div class="form-group">
  <select id="stack" name="stack">
    ${selectOptions.join('\n')}
  </select>
</div>`;

  const id = await foundry.applications.api.DialogV2.prompt({
    window: {
      title: options.title ?? 'Choose a Stack',
    },
    position: {
      width: 300,
    },
    content,
    ok: {
      label: options.label ?? 'OK',
      callback: (event, button) => button.form.elements.stack.value,
    },
    rejectClose: false,
    classes: [game.system.id, 'dialog', 'stack-chooser'],
  });
  return stacks.find(s => s.id === id);
}
