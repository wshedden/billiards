import { PoolGame } from './game.js';

const container = document.getElementById('app');
const game = new PoolGame(container);

game.tick();
window.poolGame = game;
