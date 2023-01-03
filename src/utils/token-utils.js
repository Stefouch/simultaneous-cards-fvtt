/**
 * Gets the owner of a token, first looking for non-GM users.
 * @param {TokenDocument} token
 * @param {boolean} [onlyActive=false] Whether to look only for an active user
 * @returns {User}
 */
export function getTokenOwner(token, onlyActive = false) {
  const perm = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  /** @type {User[]} */
  let users;
  if (onlyActive) users = game.users.filter(u => u.active);
  else users = game.users.contents;

  for (const u of users) {
    if (u.isGM) continue;
    if (token.testUserPermission(u, perm)) return u;
  }
  return game.user.isGM ? game.user : undefined;
}
