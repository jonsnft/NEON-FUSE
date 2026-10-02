import Phaser from "phaser";
import "./style.css";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 720,
  height: 624,
  backgroundColor: "#071015",
  pixelArt: true,
  scene: [GameScene]
});
