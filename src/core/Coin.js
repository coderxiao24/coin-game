import GameConfig from "./GameConfig.js";

// 硬币类
export default class Coin {
  constructor(scene, coinData, gameInstance) {
    this.scene = scene;
    this.coinData = coinData;
    this.gameInstance = gameInstance;
    this.isSpinning = false;
    // 创建硬币精灵
    this.sprite = this.createSprite();
  }

  // 创建硬币精灵
  createSprite() {
    const coin = this.scene.physics.add.sprite(
      this.coinData.x,
      this.coinData.y,
      `${this.coinData.type}Coin`
    );

    coin.setDepth(1);
    coin.setCircle(8);
    coin.setCollideWorldBounds(false);
    coin.body.immovable = false;
    coin.setInteractive({ useHandCursor: true });
    coin.setScale(2); // 稍微放大硬币使其更易点击

    // 存储硬币实例引用
    coin.coinInstance = this;

    // 添加点击事件
    coin.on("pointerdown", () => this.spin());

    this.gameInstance.coinGroup.add(coin);
    return coin;
  }

  // 旋转硬币
  spin() {
    if (this.isSpinning) return;

    this.isSpinning = true;

    // 播放旋转音效
    this.gameInstance.spinSound?.play();

    // 播放旋转动画
    this.sprite.play(`${this.coinData.type}Spin`);

    const offsetX = Phaser.Math.Between(-40, 40);
    const offsetY = Phaser.Math.Between(-80, 80);

    const targetX = Phaser.Math.Clamp(
      this.sprite.x + offsetX,
      GameConfig.SAFE_MARGIN,
      GameConfig.WIDTH - GameConfig.SAFE_MARGIN
    );
    const targetY = Phaser.Math.Clamp(
      this.sprite.y + offsetY,
      GameConfig.SAFE_MARGIN,
      GameConfig.HEIGHT - GameConfig.SAFE_MARGIN
    );

    // 移动动画
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 4,
      scaleY: 4,
      x: targetX,
      y: targetY,
      duration: GameConfig.ANIMATION.SPIN_DURATION,
      ease: "Quad.easeOut",
      onComplete: () => {
        // 缩放回原始大小
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: 2,
          scaleY: 2,
          duration: GameConfig.ANIMATION.SPIN_DURATION,
          ease: "Quad.easeIn",
          onComplete: () => {
            this.completeSpin(targetX, targetY);
          },
        });
      },
    });
  }

  // 完成旋转
  completeSpin(targetX, targetY) {
    // 停止旋转，播放闪光
    this.sprite.stop();
    this.sprite.setFrame(0);

    // 提高一些概率 防止玩家烦躁
    if (Math.random() < 0.7) {
      this.sprite.play(`${this.coinData.type}Flash`);
      this.showScore();
    } else {
      this.showSorryText();
    }

    // 更新硬币位置
    this.coinData.x = targetX;
    this.coinData.y = targetY;
    this.gameInstance.gameState.saveState();

    // 重置旋转状态
    this.isSpinning = false;
  }

  // 显示得分文本
  showScore() {
    // 创建数值文本，设置为白色填充，黑色边框
    const valueText = this.scene.add
      .text(this.sprite.x, this.sprite.y - 30, `${this.coinData.value}`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#ffffff", // 白色填充
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 创建货币符号文本，设置为黄色填充，黑色边框
    const dollarSign = this.scene.add
      .text(valueText.x + valueText.width / 2 + 4, this.sprite.y - 30, `$`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: GameConfig.DOLLAR_COLOR,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // 同时对两个文本应用动画效果
    this.scene.tweens.add({
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

    // 更新分数
    this.gameInstance.gameState.setScore(
      this.gameInstance.gameState.score + this.coinData.value
    );
    this.gameInstance.scoreText.setText(
      `${this.gameInstance.gameState.score}$`
    );

    // 更新按钮状态
    this.gameInstance.uiManager.updateButtons();
  }

  // 显示抱歉文本
  showSorryText() {
    const text = this.scene.add
      .text(this.sprite.x, this.sprite.y - 30, `反面没钱`, {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 20,
      duration: GameConfig.ANIMATION.FLASH_DURATION,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  // 获取精灵
  getSprite() {
    return this.sprite;
  }

  // 获取硬币数据
  getCoinData() {
    return this.coinData;
  }

  // 更新硬币数据
  updateCoinData(newData) {
    this.coinData = { ...this.coinData, ...newData };
  }

  // 销毁硬币
  destroy() {
    this.sprite.destroy();
  }
}
