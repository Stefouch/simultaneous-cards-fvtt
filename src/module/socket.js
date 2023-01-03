import { MODULE_ID } from './constants';

export default class Socket {
  static SOCKET = `module.${MODULE_ID}`;

  static emit(data) {
    game.socket.emit(this.SOCKET, {
      event: 'send',
      data,
    });
  }

  static listen() {
    game.socket.on(this.SOCKET, data => {
      // TODO
    });
  }
}
