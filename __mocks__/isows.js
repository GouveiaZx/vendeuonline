// Mock para isows para resolver problemas de ESM nos testes

const WebSocket = require('ws');

module.exports = {
  WebSocket,
  getNativeWebSocket: () => WebSocket,
  default: WebSocket
};