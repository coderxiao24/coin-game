import GameConfig from "../core/GameConfig.js";
// 资源加载器
export default class ResourceLoader {
  constructor(scene, gameInstance) {
    this.scene = scene;
    this.game = gameInstance;
  }

  preload() {
    this.game.uiManager.updateLoadingProgress(33, "加载图像资源...");
    this.scene.load.audio("slimeSound", "public/slime.mp3");

    this.scene.load.image("woodenFloor", "public/floors/wooden.png");
    this.scene.load.image("shopWoodenFloor", "public/floors/shopWooden.png");

    this.scene.load.spritesheet(`helper`, `public/helper.png`, {
      frameWidth: 48,
      frameHeight: 48,
    });
    this.scene.load.spritesheet(`slime`, `public/slime.png`, {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 加载硬币精灵图
    Object.values(GameConfig.COIN_TYPES).forEach((coinType) => {
      this.scene.load.spritesheet(
        `${coinType.name}Coin`,
        `public/${
          coinType.name.charAt(0).toUpperCase() + coinType.name.slice(1)
        }CoinSpin.png`,
        { frameWidth: 16, frameHeight: 16 }
      );
      this.scene.load.spritesheet(
        `${coinType.name}CoinFlash`,
        `public/${
          coinType.name.charAt(0).toUpperCase() + coinType.name.slice(1)
        }CoinFlash.png`,
        { frameWidth: 16, frameHeight: 16 }
      );
    });

    this.scene.load.once("complete", () => {
      this.loadAudio();
    });
  }

  loadAudio() {
    this.game.uiManager.updateLoadingProgress(66, "加载音频...");
    this.scene.load.audio("spinSound", "public/coin_spin.mp3");
    this.scene.load.audio("attackSound", "public/helper_attack.mp3");

    this.scene.load.once("complete", () => {
      this.game.spinSound = this.scene.sound.add("spinSound");
      this.game.attackSound = this.scene.sound.add("attackSound");

      this.game.slimeHitSound = this.scene.sound.add("slimeSound", {
        volume: 0.5,
        // 不循环，默认单次
      });

      this.game.uiManager.updateLoadingProgress(100, "游戏准备就绪!");
      setTimeout(() => {
        this.game.uiManager.hideLoadingScreen();
      }, 200);

      this.loadBGM();
    });

    this.scene.load.start();
  }

  loadBGM() {
    this.scene.load.audio("bgm", "public/bgm.mp3");

    this.scene.load.once("complete", () => {
      this.game.initBgm(this.scene);
    });

    this.scene.load.start();
  }
}
