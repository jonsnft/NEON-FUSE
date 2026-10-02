import { AUTO, Game } from "phaser";
import "./style.css";
import { GameScene } from "./scenes/GameScene";
import { LobbyScene } from "./scenes/LobbyScene";
import { OnlineGameScene } from "./scenes/OnlineGameScene";

const offline = new URLSearchParams(window.location.search).get("offline") === "1";

new Game({
  type: AUTO,
  parent: "game",
  width: 720,
  height: 624,
  backgroundColor: "#071015",
  pixelArt: true,
  scene: offline ? [GameScene] : [LobbyScene, OnlineGameScene]
});
