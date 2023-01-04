import { SIMOC } from '@module/config';
import { MODULE_ID } from '@module/constants';

/**
 * Gets a cards stack.
 * @param {string} idOrName
 * @returns {Cards}
 */
export function getCardsStack(idOrName) {
  return game.cards.find(stack =>
    stack.id === idOrName ||
    stack.name === idOrName ||
    stack.name.includes(idOrName),
  );
}

/**
 * Displays a dialog for choosing a card.
 * @param {Cards[]} cards
 * @param {Object} [options]
 * @param {string} [options.title='Choose a Card'] Title of the dialog
 * @param {string} [options.label='OK'] Label of the button
 * @param {string} [options.description] Additional description added on top
 */
export async function chooseCard(cards, options = {}) {
  if (cards.length <= 1) return cards[0];

  const content = await renderTemplate(SIMOC.templates.cardChooserDialog, {
    cards,
    description: options.description,
    config: SIMOC,
  });

  const id = await Dialog.prompt({
    title: options.title ?? 'Choose a Card',
    label: options.label ?? 'OK',
    content,
    render: html => {
      html.find('input[type=radio]').on('click', event => {
        const btn = event.currentTarget.closest('.window-content').querySelector('button.ok');
        btn.click();
      });
    },
    callback: html => html[0].querySelector('form').card.value,
    rejectClose: false,
    options: {
      classes: [MODULE_ID, game.system.id, 'dialog', 'card-chooser'],
      resizable: true,
      width: 600,
      // height: 440,
    },
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
<form autocomplete="off">
  <div class="form-group">
    <select id="stack">
      ${selectOptions.join('\n')}
    </select>
  </div>
</form>`;

  const id = await Dialog.prompt({
    title: options.title ?? 'Choose a Stack',
    label: options.label ?? 'OK',
    content,
    callback: html => html[0].querySelector('form').stack.value,
    rejectClose: false,
    options: { classes: [game.system.id, 'dialog', 'stack-chooser'] },
  });
  return stacks.find(s => s.id === id);
}
