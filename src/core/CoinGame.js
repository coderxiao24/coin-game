import GameState from "../managers/GameState.js";
import UIManager from "../managers/UIManager.js";
import ResourceLoader from "../managers/ResourceLoader.js";
import AnimationManager from "../managers/AnimationManager.js";
import GameConfig from "./GameConfig.js";

// 游戏主类
export default class CoinGame {
  constructor() {
    this.gameState = new GameState();
    this.uiManager = new UIManager(this);
    this.coinSprites = [];
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
    };

    this.game = new Phaser.Game(this.config);

    window.addEventListener("beforeunload", () => {
      this.gameState.ensureSaved();
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

    this.coinSprites = scene.physics.add.group();

    // 创建动画管理器
    this.animationManager = new AnimationManager(scene);

    this.createGameBackground(scene);
    this.createShopBackground(scene);
    this.scoreText = this.uiManager.createScoreText(scene);
    this.uiManager.createShopButtons(scene);
    this.animationManager.createCoinAnimations();
    this.animationManager.createHelperAnimations();
    this.createCoins(scene);
    scene.physics.add.collider(this.coinSprites, this.coinSprites);
    this.createHelpers(scene);
    this.uiManager.updateButtons();
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

    // 创建所有硬币精灵
    this.gameState.coins.forEach((coinData) => {
      this.createCoinSprite(scene, coinData);
    });
  }

  createCoinSprite(scene, coinData) {
    const coin = this.coinSprites.create(
      coinData.x,
      coinData.y,
      `${coinData.type}Coin`
    );
    coin.setCircle(8);
    coin.setCollideWorldBounds(false);
    coin.body.immovable = false;
    coin.setInteractive({ useHandCursor: true });
    coin.setScale(2); // 稍微放大硬币使其更易点击

    // 存储硬币数据
    coin.coinData = coinData;
    coin.isSpinning = false;
    coin.setDepth(0);

    // 添加点击事件
    coin.on("pointerdown", () => this.spinCoin(coin));

    return coin;
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
    if (helper.helperData.direction === "left") {
      helper.flipX = true;
    } else {
      helper.flipX = false;
    }

    this.helperSprites.push(helper);
    return helper;
  }

  spinCoin(coin) {
    if (coin.isSpinning) return;

    const scene = this.game.scene.scenes[0];
    coin.isSpinning = true;
    coin.setDepth(1);
    this.spinSound?.play();

    // 播放旋转动画
    coin.play(`${coin.coinData.type}Spin`);

    const offsetX = Phaser.Math.Between(-40, 40);
    const offsetY = Phaser.Math.Between(-80, 80);

    const targetX = Phaser.Math.Clamp(
      coin.x + offsetX,
      GameConfig.SAFE_MARGIN,
      GameConfig.WIDTH - GameConfig.SAFE_MARGIN
    );
    const targetY = Phaser.Math.Clamp(
      coin.y + offsetY,
      GameConfig.SAFE_MARGIN,
      GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
    );

    // 移动动画
    scene.tweens.add({
      targets: coin,
      scaleX: 4,
      scaleY: 4,
      x: targetX,
      y: targetY,
      duration: GameConfig.ANIMATION.SPIN_DURATION,
      ease: "Quad.easeOut",
      onComplete: () => {
        // 缩放回原始大小
        scene.tweens.add({
          targets: coin,
          scaleX: 2,
          scaleY: 2,
          duration: GameConfig.ANIMATION.SPIN_DURATION,
          ease: "Quad.easeIn",
          onComplete: () => {
            // 停止旋转，播放闪光
            coin.stop();
            coin.setFrame(0);
            // 提高一些概率 防止玩家烦躁
            if (Math.random() < 0.7) {
              coin.play(`${coin.coinData.type}Flash`);

              // 显示加分文本
              this.showScoreText(scene, coin, coin.coinData.value);

              // 更新分数
              this.gameState.setScore(
                this.gameState.score + coin.coinData.value
              );
              this.scoreText.setText(`${this.gameState.score}$`);

              // 更新按钮状态
              this.uiManager.updateButtons();
            } else {
              this.showSorryText(scene, coin);
            }
            // 更新硬币位置
            coin.coinData.x = targetX;
            coin.coinData.y = targetY;
            this.gameState.saveState();

            // 重置旋转状态
            coin.isSpinning = false;
            coin.setDepth(0);
          },
        });
      },
    });
  }

  showScoreText(scene, coin, value) {
    // 创建数值文本，设置为白色填充，黑色边框
    const valueText = scene.add
      .text(coin.x, coin.y - 30, `${value}`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#ffffff", // 白色填充
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 创建货币符号文本，设置为黄色填充，黑色边框
    const dollarSign = scene.add
      .text(valueText.x + valueText.width / 2 + 4, coin.y - 30, `$`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: GameConfig.DOLLAR_COLOR,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 同时对两个文本应用动画效果
    scene.tweens.add({
      targets: [valueText, dollarSign],
      alpha: 0,
      y: valueText.y - 20,
      duration: GameConfig.ANIMATION.FLASH_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => {
        valueText.destroy();
        dollarSign.destroy();
      },
    });
  }

  showSorryText(scene, coin) {
    const Text = scene.add
      .text(coin.x, coin.y - 30, `反面没钱`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    scene.tweens.add({
      targets: Text,
      alpha: 0,
      y: Text.y - 20,
      duration: GameConfig.ANIMATION.FLASH_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => Text.destroy(),
    });
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
      this.createCoinSprite(this.game.scene.scenes[0], newCoin);

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

  update() {
    // Step 1: 收集所有有效 helper（非疲劳状态）
    const availableHelpers = this.helperSprites.filter((helper) => {
      if (
        helper.helperData.isTired &&
        Date.now() - helper.helperData.isTired < 5000
      ) {
        // 处理疲劳动画（同原来逻辑）
        if (Date.now() - helper.helperData.isTired > 500) {
          const animKey = `helper-death`;
          if (helper.anims.currentAnim?.key !== animKey) {
            helper.play(animKey);
            helper.flipX = helper.helperData.direction === "left";
          }
        }
        return false; // 疲劳中，不参与分配
      }
      delete helper.helperData.isTired;
      return true;
    });

    const availableCoins = this.coinSprites
      .getChildren()
      .filter((coin) => !coin.isSpinning);

    // Step 2: 构建所有可能的 (helper, coin, distance) 配对
    const pairs = [];
    for (const helper of availableHelpers) {
      for (const coin of availableCoins) {
        const dx = coin.x - helper.x;
        const dy = coin.y - helper.y;
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
    this.helperSprites.forEach((helper) => {
      // 先处理疲劳中的 helper（已在 availableHelpers 过滤，但需保持动画）
      if (
        helper.helperData.isTired &&
        Date.now() - helper.helperData.isTired < 5000
      ) {
        // 动画已在上面处理过，这里可跳过或保留检查
        return;
      }

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
              : helper.helperData.direction
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
              : helper.helperData.direction
          }`;

          helper.setVelocity(0, 0);
          if (helper.anims.currentAnim?.key !== animKey) {
            helper.play(animKey);
            helper.flipX = helper.helperData.direction === "left";

            this.attackSound?.play();

            setTimeout(() => {
              this.spinCoin(coin);
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
          if (helper.helperData.direction === "left") {
            helper.flipX = true;
          } else {
            helper.flipX = false;
          }
        }
        // 没有目标：停止
        helper.setVelocity(0, 0);
      }

      this.gameState.saveState();
    });

    this.coinSprites.children.entries.forEach((coin) => {
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
  }
}
