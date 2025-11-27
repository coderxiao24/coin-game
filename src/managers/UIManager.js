import GameConfig from "../core/GameConfig.js";
// UI管理器
export default class UIManager {
  constructor(gameInstance) {
    this.game = gameInstance;
  }

  showStartMenu() {
    const startMenu = document.getElementById("start-menu");
    const menuButtons = document.getElementById("menu-buttons");

    menuButtons.innerHTML = "";
    const hasSaveData = this.game.gameState.hasSaveData();

    if (hasSaveData) {
      this._createButton(menuButtons, "继续游戏", "success", () => {
        this.hideStartMenu();
        this.game.initGame();
      });

      this._createButton(menuButtons, "重新开始", "warning", () => {
        if (confirm("确定要重新开始吗？这将清除您当前的所有进度！")) {
          this.game.gameState.resetGame();
          this.hideStartMenu();
          this.game.initGame();
        }
      });
    } else {
      this._createButton(menuButtons, "开始游戏", "success", () => {
        this.hideStartMenu();
        this.game.initGame();
      });
    }

    startMenu.style.display = "flex";
  }

  _createButton(container, text, type, onClick) {
    const button = document.createElement("button");
    button.className = `menu-button ${type}`;
    button.textContent = text;
    button.onclick = onClick;
    container.appendChild(button);
  }

  hideStartMenu() {
    const startMenu = document.getElementById("start-menu");
    startMenu.style.display = "none";
  }

  showLoadingScreen() {
    const loadingContainer = document.getElementById("loading-container");
    loadingContainer.style.display = "flex";
  }

  hideLoadingScreen() {
    const loadingContainer = document.getElementById("loading-container");
    loadingContainer.style.display = "none";
  }

  updateLoadingProgress(progress, text) {
    const loadingBar = document.getElementById("loading-bar");
    const loadingText = document.getElementById("loading-text");

    loadingBar.style.width = `${progress}%`;
    loadingText.textContent = text || `${Math.round(progress)}%`;
  }

  createScoreText(scene) {
    return scene.add
      .text(
        (GameConfig.WIDTH + GameConfig.SHOP_WIDTH) / 2,
        24,
        `${this.game.gameState.score}$`,
        {
          fontSize: "24px",
          color: "#fff",
          stroke: "#000",
          strokeThickness: 4,
          fontWeight: "bold",
        }
      )
      .setOrigin(0.5)
      .setDepth(9999);
  }

  createShopButtons(scene) {
    this.shopButtons = {};

    Object.values(GameConfig.COIN_TYPES).forEach((coinType, index) => {
      const button = scene.add
        .text(
          GameConfig.WIDTH + GameConfig.SHOP_WIDTH / 2,
          80 * (index + 1),
          "",
          {
            fontSize: "20px",
            color: "#fff",
            stroke: "#000",
            strokeThickness: 3,
            padding: { x: 4, y: 8 },
            fixedWidth: GameConfig.SHOP_WIDTH - 20,
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.game.buyCoin(coinType));

      this.shopButtons[coinType.name] = button;
    });

    // 添加助手购买按钮
    this.helperButton = scene.add
      .text(GameConfig.WIDTH + GameConfig.SHOP_WIDTH / 2, 320, "", {
        fontSize: "20px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3,
        padding: { x: 4, y: 8 },
        fixedWidth: GameConfig.SHOP_WIDTH - 20,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.game.buyHelper());
  }

  updateButtons() {
    Object.values(GameConfig.COIN_TYPES).forEach((coinType) => {
      const button = this.shopButtons[coinType.name];
      const price = this.game.calculatePrice(coinType);

      button.setText(`${this.game.getCoinTypeName(coinType.name)}\n${price}$`);

      if (this.game.gameState.score >= price) {
        button.setInteractive({ useHandCursor: true });
        button.setColor("#fff");
        button.setBackgroundColor("#52c41a");
      } else {
        button.disableInteractive();
        button.setColor("#888");
        button.setBackgroundColor("#bfbfbf");
      }
    });

    // 更新助手按钮
    const helperPrice = this.game.calculateHelperPrice();
    this.helperButton.setText(`助手\n${helperPrice}$`);

    if (this.game.gameState.score >= helperPrice) {
      this.helperButton.setInteractive({ useHandCursor: true });
      this.helperButton.setColor("#fff");
      this.helperButton.setBackgroundColor("#52c41a");
    } else {
      this.helperButton.disableInteractive();
      this.helperButton.setColor("#888");
      this.helperButton.setBackgroundColor("#bfbfbf");
    }
  }
}
