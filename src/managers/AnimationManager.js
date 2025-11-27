import GameConfig from "../core/GameConfig.js";
// 动画管理器
export default class AnimationManager {
  constructor(scene) {
    this.scene = scene;
  }

  createCoinAnimations() {
    Object.values(GameConfig.COIN_TYPES).forEach((coinType) => {
      // 旋转动画
      this.scene.anims.create({
        key: `${coinType.name}Spin`,
        frames: this.scene.anims.generateFrameNumbers(`${coinType.name}Coin`, {
          start: 0,
          end: 5,
        }),
        frameRate: GameConfig.ANIMATION.SPIN_FRAME_RATE,
        repeat: -1,
      });

      // 闪光动画
      this.scene.anims.create({
        key: `${coinType.name}Flash`,
        frames: this.scene.anims.generateFrameNumbers(
          `${coinType.name}CoinFlash`,
          {
            start: 0,
            end: 6,
          }
        ),
        frameRate: GameConfig.ANIMATION.FLASH_FRAME_RATE,
        repeat: 0,
      });
    });
  }

  createHelperAnimations() {
    const directions = ["down", "right", "up"];

    directions.forEach((direction, index) => {
      // 空闲动画
      this.scene.anims.create({
        key: `helper-idle-${direction}`,
        frames: this.scene.anims.generateFrameNumbers(`helper`, {
          start: index * 6,
          end: index * 6 + 5,
        }),
        frameRate: GameConfig.ANIMATION.HELPER_FRAME_RATE,
        repeat: -1,
      });

      // 移动动画
      this.scene.anims.create({
        key: `helper-move-${direction}`,
        frames: this.scene.anims.generateFrameNumbers(`helper`, {
          start: index * 6 + 18,
          end: index * 6 + 23,
        }),
        frameRate: GameConfig.ANIMATION.HELPER_FRAME_RATE,
        repeat: -1,
      });

      // 攻击动画
      this.scene.anims.create({
        key: `helper-attack-${direction}`,
        frames: this.scene.anims.generateFrameNumbers(`helper`, {
          start: index * 6 + 36,
          end: index * 6 + 39,
        }),
        frameRate: GameConfig.ANIMATION.HELPER_FRAME_RATE,
        repeat: 0,
      });
    });

    // 死亡动画
    this.scene.anims.create({
      key: `helper-death`,
      frames: this.scene.anims.generateFrameNumbers(`helper`, {
        start: 54,
        end: 56,
      }),
      frameRate: GameConfig.ANIMATION.HELPER_FRAME_RATE,
      repeat: 0,
    });
  }
}
