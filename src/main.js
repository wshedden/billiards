import { Game } from './game.js';

const game = new Game({
  appRoot: document.querySelector('#app'),
  hudState: document.querySelector('#state'),
  powerLabel: document.querySelector('#shot-power'),
  spinCanvas: document.querySelector('#spin-canvas'),
  spinLabel: document.querySelector('#spin-label'),
});

game.start();

window.poolGame = game;
