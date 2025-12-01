import GameConfig from "../core/GameConfig.js";
export const showScore = (gameInstance, { x, y }, value) => {
  const scene = gameInstance.game.scene.scenes[0];
  // 创建数值文本，设置为白色填充，黑色边框
  const valueText = scene.add
    .text(x, y - 30, `${value}`, {
      fontSize: "16px",
      fontWeight: "bold",
      color: "#ffffff", // 白色填充
      stroke: "#000000",
      strokeThickness: 4,
    })
    .setOrigin(0.5);

  // 创建货币符号文本，设置为黄色填充，黑色边框
  const dollarSign = scene.add
    .text(valueText.x + valueText.width / 2 + 4, y - 30, `$`, {
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

  // 更新分数
  gameInstance.gameState.setScore(gameInstance.gameState.score + value);
  gameInstance.scoreText.setText(`${gameInstance.gameState.score}$`);

  // 更新按钮状态
  gameInstance.uiManager.updateButtons();
};
