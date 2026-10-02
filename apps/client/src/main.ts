import { AUTO, Game } from "phaser";
import "./style.css";
import { GameScene } from "./scenes/GameScene";

new Game({
  type: AUTO,
  parent: "game",
  width: 720,
  height: 624,
  backgroundColor: "#071015",
  pixelArt: true,
  scene: [GameScene]
});
