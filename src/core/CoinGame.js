import GameState from "../managers/GameState.js";
import UIManager from "../managers/UIManager.js";
import ResourceLoader from "../managers/ResourceLoader.js";
import AnimationManager from "../managers/AnimationManager.js";
import GameConfig from "./GameConfig.js";
import Coin from "./Coin.js";
import Slime from "./Slime.js";

// 游戏主类
export default class CoinGame {
  coinGroup = null;
  constructor() {
    this.gameState = new GameState();
    this.uiManager = new UIManager(this);
    this.coins = []; // 存储Coin实例
    this.slimes = [];
    this.helperSprites = [];
    this.uiManager.showStartMenu();
  }
  initGame() {
    // 显示加载界面
    this.uiManager.showLoadingScreen();
    this.uiManager.updateLoadingProgress(10, "初始化游戏...");

    const totalWidth = GameConfig.WIDTH + GameConfig.SHOP_WIDTH;

    this.config = {
      type: Phaser.AUTO,
      width: totalWidth,
      height: GameConfig.HEIGHT,
      parent: "game-container",
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this),
      },
      audio: {
        disableWebAudio: false,
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: "game-container",
        width: totalWidth,
        height: GameConfig.HEIGHT,
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      input: {
        activePointers: 4,
        touch: true,
        mouse: true,
      },
      render: {
        antialias: false,
        pixelArt: true, // 如果使用像素风格
      },
    };

    this.game = new Phaser.Game(this.config);

    window.addEventListener("beforeunload", () => {
      this.gameState.ensureSaved();
      if (this.slimeSpawner) {
        this.slimeSpawner.remove(); // 安全移除
      }
    });
  }

  preload() {
    const scene = this.game.scene.scenes[0];
    this.resourceLoader = new ResourceLoader(scene, this);
    this.resourceLoader.preload();
  }

  initBgm(scene) {
    // 创建音效实例
    this.bgm = scene.sound.add("bgm", {
      loop: true,
      volume: 0.7, // 降低音量避免干扰
    });
    // 播放背景音乐
    this.bgm.play();
  }

  create() {
    const scene = this.game.scene.scenes[0];

    this.coinGroup = scene.physics.add.group();

    // 创建动画管理器
    this.animationManager = new AnimationManager(scene);

    this.createGameBackground(scene);
    this.createShopBackground(scene);
    this.scoreText = this.uiManager.createScoreText(scene);
    this.uiManager.createShopButtons(scene);
    this.animationManager.createCoinAnimations();
    this.animationManager.createHelperAnimations();
    this.animationManager.createSlimeAnimations();
    this.createCoins(scene);
    this.createSlimes(scene);
    scene.physics.add.collider(this.coinGroup, this.coinGroup);
    this.createHelpers(scene);

    this.uiManager.updateButtons();

    this.slimeSpawner = scene.time.addEvent({
      delay: 1000 * 10,
      callback: this.randomCreateSlime,
      callbackScope: this,
      loop: true,
    });
  }

  createGameBackground(scene) {
    const floor = scene.add.tileSprite(
      GameConfig.WIDTH / 2,
      GameConfig.HEIGHT / 2,
      GameConfig.WIDTH,
      GameConfig.HEIGHT,
      "woodenFloor"
    );
    floor.setOrigin(0.5, 0.5);
  }

  createShopBackground(scene) {
    const shopFloor = scene.add.tileSprite(
      GameConfig.WIDTH + GameConfig.SHOP_WIDTH / 2,
      GameConfig.HEIGHT / 2,
      GameConfig.SHOP_WIDTH,
      GameConfig.HEIGHT,
      "shopWoodenFloor"
    );
    shopFloor.setOrigin(0.5);

    scene.add
      .text(GameConfig.WIDTH + GameConfig.SHOP_WIDTH / 2, 28, `商店`, {
        fontSize: "32px",
        fontWeight: "bold",
        color: GameConfig.DOLLAR_COLOR,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
  }

  createHelpers(scene) {
    // 创建所有助手精灵
    this.gameState.helpers.forEach((helperData) => {
      this.createHelperSprite(scene, helperData);
    });
  }

  createCoins(scene) {
    // 如果没有硬币，创建一个默认的铜币
    if (this.gameState.coins.length === 0) {
      this.gameState.addCoin({
        type: GameConfig.COIN_TYPES.COPPER.name,
        value: GameConfig.COIN_TYPES.COPPER.value,
        x: GameConfig.WIDTH / 2,
        y: GameConfig.HEIGHT / 2,
      });
    }

    // 创建所有硬币实例
    this.gameState.coins.forEach((coinData) => {
      this.createCoinInstance(scene, coinData);
    });
  }

  createSlimes(scene) {
    // 创建所有硬币实例
    this.gameState.slimes.forEach((slimeData) => {
      this.createSlimeInstance(scene, slimeData);
    });
  }

  createCoinInstance(scene, coinData) {
    const coin = new Coin(scene, coinData, this);
    this.coins.push(coin);
    return coin;
  }

  createSlimeInstance(scene, slimeData) {
    const slime = new Slime(scene, slimeData, this);
    this.slimes.push(slime);
    return slime;
  }

  createHelperSprite(scene, helperData) {
    const helper = scene.physics.add.sprite(
      helperData.x,
      helperData.y,
      "helper"
    );
    helper.setScale(2);
    helper.helperData = helperData;

    const animKey = `helper-idle-${
      helper.helperData.direction === "left"
        ? "right"
        : helper.helperData.direction || "down"
    }`;
    helper.play(animKey);

    helper.flipX = helper.helperData.direction === "left";

    helper.on(
      "animationcomplete",
      function (anim) {
        if (anim.key.startsWith("helper-attack")) {
          helper.play("helper-death");
          helper.flipX = helper.helperData.direction === "left";
        }
      },
      scene
    );

    this.helperSprites.push(helper);
    return helper;
  }

  buyCoin(coinType) {
    const price = this.calculatePrice(coinType);

    if (this.gameState.score >= price) {
      // 扣除分数
      this.gameState.setScore(this.gameState.score - price);
      this.scoreText.setText(`${this.gameState.score}$`);

      // 创建新硬币
      const x = Phaser.Math.Between(
        GameConfig.SAFE_MARGIN,
        GameConfig.WIDTH - GameConfig.SAFE_MARGIN
      );
      const y = Phaser.Math.Between(
        GameConfig.SAFE_MARGIN,
        GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
      );

      const newCoin = {
        type: coinType.name,
        value: coinType.value,
        x,
        y,
      };

      this.gameState.addCoin(newCoin);
      this.createCoinInstance(this.game.scene.scenes[0], newCoin);

      // 更新按钮状态
      this.uiManager.updateButtons();
    }
  }

  buyHelper() {
    const price = this.calculateHelperPrice();

    if (this.gameState.score >= price) {
      // 扣除分数
      this.gameState.setScore(this.gameState.score - price);
      this.scoreText.setText(`${this.gameState.score}$`);

      // 创建新助手
      const x = Phaser.Math.Between(
        GameConfig.SAFE_MARGIN,
        GameConfig.WIDTH - GameConfig.SAFE_MARGIN
      );
      const y = Phaser.Math.Between(
        GameConfig.SAFE_MARGIN,
        GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
      );

      const newHelper = {
        x,
        y,
        direction: "down", // 默认方向
      };

      this.gameState.addHelper(newHelper);
      this.createHelperSprite(this.game.scene.scenes[0], newHelper);

      // 更新按钮状态
      this.uiManager.updateButtons();
    }
  }

  calculatePrice(coinType) {
    const count = this.gameState.coins.filter(
      (coin) => coin.type === coinType.name
    ).length;

    return coinType.basePrice * (count || 0.5);
  }

  calculateHelperPrice() {
    const count = this.gameState.helpers.length;
    return GameConfig.HELPER.basePrice * (count || 0.5);
  }

  getCoinTypeName(type) {
    const names = {
      copper: "铜币",
      silver: "银币",
      gold: "金币",
    };
    return names[type] || type;
  }

  randomCreateSlime() {
    // 创建新硬币
    const x = Phaser.Math.Between(
      GameConfig.SAFE_MARGIN,
      GameConfig.WIDTH - GameConfig.SAFE_MARGIN
    );
    const y = Phaser.Math.Between(
      GameConfig.SAFE_MARGIN,
      GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
    );

    const newSlime = {
      direction: "down",
      x,
      y,
    };

    this.gameState.addSlime(newSlime);
    this.createSlimeInstance(this.game.scene.scenes[0], newSlime);
  }
  update() {
    // Step 1: 收集所有有效 helper（非疲劳状态）
    const availableHelpers = this.helperSprites.filter((helper) => {
      if (
        helper.helperData.isTired &&
        Date.now() - helper.helperData.isTired < 5000
      ) {
        return false; // 疲劳中，不参与分配
      }
      delete helper.helperData.isTired;
      return true;
    });

    const availableCoins = this.coins.filter((coin) => !coin.isSpinning);

    // Step 2: 构建所有可能的 (helper, coin, distance) 配对
    const pairs = [];
    for (const helper of availableHelpers) {
      for (const coin of availableCoins) {
        const sprite = coin.getSprite();
        const dx = sprite.x - helper.x;
        const dy = sprite.y - helper.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        pairs.push({ helper, coin, dist, dx, dy });
      }
    }

    // Step 3: 按距离升序排序（最近的优先匹配）
    pairs.sort((a, b) => a.dist - b.dist);

    // Step 4: 贪心分配（确保一对一）
    const assignedHelpers = new Set();
    const assignedCoins = new Set();
    const assignments = new Map(); // helper → { coin, dx, dy, dist }

    for (const { helper, coin, dx, dy, dist } of pairs) {
      if (assignedHelpers.has(helper) || assignedCoins.has(coin)) {
        continue; // 已分配，跳过
      }
      assignedHelpers.add(helper);
      assignedCoins.add(coin);
      assignments.set(helper, { coin, dx, dy, dist });
    }

    // Step 5: 更新每个 helper 的行为
    availableHelpers.forEach((helper) => {
      const assignment = assignments.get(helper);
      if (assignment) {
        const { coin, dx, dy, dist } = assignment;

        // 确定方向
        if (Math.abs(dx) > Math.abs(dy)) {
          helper.helperData.direction = dx > 0 ? "right" : "left";
        } else {
          helper.helperData.direction = dy > 0 ? "down" : "up";
        }

        if (dist > 20) {
          // 移动
          const speed = 100;
          helper.setVelocity((dx / dist) * speed, (dy / dist) * speed);

          const animKey = `helper-move-${
            helper.helperData.direction === "left"
              ? "right"
              : helper.helperData.direction || "down"
          }`;

          if (helper.anims.currentAnim?.key !== animKey) {
            helper.play(animKey);
            helper.flipX = helper.helperData.direction === "left";
          }
        } else {
          // 攻击
          const animKey = `helper-attack-${
            helper.helperData.direction === "left"
              ? "right"
              : helper.helperData.direction || "down"
          }`;

          helper.setVelocity(0, 0);
          if (helper.anims.currentAnim?.key !== animKey) {
            helper.play(animKey);
            helper.flipX = helper.helperData.direction === "left";

            this.attackSound?.play();

            setTimeout(() => {
              coin.spin();
            }, 100);

            helper.helperData.isTired = Date.now();
          }
        }

        helper.helperData.x = helper.x;
        helper.helperData.y = helper.y;
      } else {
        const animKey = `helper-idle-${
          helper.helperData.direction === "left"
            ? "right"
            : helper.helperData.direction || "down"
        }`;
        if (helper.anims.currentAnim?.key !== animKey) {
          helper.play(animKey);
          helper.flipX = helper.helperData.direction === "left";
        }
        // 没有目标：停止
        helper.setVelocity(0, 0);
      }
    });

    // 防止硬币挤出边界
    this.coins.forEach((coinInstance) => {
      const coin = coinInstance.getSprite();
      coin.x = Phaser.Math.Clamp(
        coin.x,
        GameConfig.SAFE_MARGIN,
        GameConfig.WIDTH - GameConfig.SAFE_MARGIN
      );
      coin.y = Phaser.Math.Clamp(
        coin.y,
        GameConfig.SAFE_MARGIN,
        GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
      );

      coinInstance.coinData.x = coin.x;
      coinInstance.coinData.y = coin.y;
      if (
        coin.x <= GameConfig.SAFE_MARGIN ||
        coin.x >= GameConfig.WIDTH - GameConfig.SAFE_MARGIN
      ) {
        coin.body.velocity.x = 0; // 停止水平移动（防止"卡墙抖动"）
      }

      if (
        coin.y <= GameConfig.SAFE_MARGIN ||
        coin.y >= GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
      ) {
        coin.body.velocity.y = 0;
      }
    });

    this.gameState.saveState();
  }
}
