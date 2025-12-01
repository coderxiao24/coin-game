import GameConfig from "./GameConfig.js";

// 史莱姆类
export default class Slime {
  constructor(scene, slimeData, gameInstance) {
    this.scene = scene;
    this.slimeData = slimeData;
    this.gameInstance = gameInstance;
    this.isAttacking = false;
    this.isMoving = false;

    // 创建史莱姆精灵
    this.sprite = this.createSprite();
    // 初始播放空闲动画
    this.playIdleAnimation();

    this.moveSound = this.scene.sound.add("slimeSound", {
      volume: 0.5,
      loop: true,
      rate: 0.5,
    });
  }

  // 创建史莱姆精灵
  createSprite() {
    const slime = this.scene.physics.add.sprite(
      this.slimeData.x,
      this.slimeData.y,
      "slime"
    );

    slime.setScale(2);

    // 存储史莱姆实例引用
    slime.slimeInstance = this;
    slime.setInteractive({ useHandCursor: true });
    // 添加动画完成事件监听
    slime.on("animationcomplete", (anim) => {
      this.handleAnimationComplete(anim);
    });

    slime.on("pointerdown", () => {
      this.takeDamage();
    });

    return slime;
  }

  // 播放空闲动画
  playIdleAnimation() {
    if (!this.slimeData.active || this.isAttacking) return;

    const animKey = `slime-idle-${
      this.slimeData.direction === "left"
        ? "right"
        : this.slimeData.direction || "down"
    }`;
    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
      this.sprite.flipX = this.slimeData.direction === "left";
    }
  }

  // 播放移动动画
  playMoveAnimation() {
    if (!this.slimeData.active || this.isAttacking) return;

    const animKey = `slime-move-${
      this.slimeData.direction === "left"
        ? "right"
        : this.slimeData.direction || "down"
    }`;
    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
      this.sprite.flipX = this.slimeData.direction === "left";
    }
  }

  // 播放攻击动画
  playAttackAnimation() {
    if (!this.slimeData.active) return;
    this.isAttacking = true;
    const animKey = `slime-attack-${
      this.slimeData.direction === "left"
        ? "right"
        : this.slimeData.direction || "down"
    }`;
    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
      this.sprite.flipX = this.slimeData.direction === "left";
    }
  }

  // 播放受伤动画
  playHitAnimation() {
    const animKey = `slime-hit-${
      this.slimeData.direction === "left"
        ? "right"
        : this.slimeData.direction || "down"
    }`;

    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
      this.sprite.flipX = this.slimeData.direction === "left";
    }
  }

  // 播放死亡动画
  playDeathAnimation() {
    this.slimeData.active = false;
    this.sprite.play("slime-death");
    this.sprite.flipX = this.slimeData.direction === "left";
  }

  // 处理动画完成事件
  handleAnimationComplete(anim) {
    if (anim.key.startsWith("slime-attack")) {
      // 攻击动画完成后回到空闲状态
      this.isAttacking = false;
      this.playIdleAnimation();
    } else if (anim.key.startsWith("slime-hit")) {
      // 受伤动画完成后回到空闲状态
      this.die();
    } else if (anim.key === "slime-death") {
      // 死亡动画完成后销毁精灵
      this.destroy();
    }
  }

  // 移动史莱姆
  moveTo(targetX, targetY) {
    if (!this.slimeData.active || this.isAttacking) return;

    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    return moveBy(dx, dy);
  }

  moveBy(dx, dy) {
    if (!this.slimeData.active || this.isAttacking) return;
    if (!this.moveSound?.isPlaying) {
      this.moveSound?.play();
    }
    const distance = Math.sqrt(dx * dx + dy * dy);

    let arrived = false;
    if (distance > 20) {
      this.isMoving = true;

      // 确定方向
      if (Math.abs(dx) > Math.abs(dy)) {
        this.slimeData.direction = dx > 0 ? "right" : "left";
      } else {
        this.slimeData.direction = dy > 0 ? "down" : "up";
      }

      // 设置速度
      const speed = 80;
      this.sprite.setVelocity((dx / distance) * speed, (dy / distance) * speed);

      // 播放移动动画
      this.playMoveAnimation();
    } else {
      arrived = true;
      // 到达目标位置，停止移动
      this.stopMoving();
    }
    this.slimeData.x = this.sprite.x;
    this.slimeData.y = this.sprite.y;

    return arrived;
  }

  // 停止移动
  stopMoving() {
    if (this.moveSound?.isPlaying) {
      this.moveSound?.stop(); // 只影响自己
    }
    this.isMoving = false;
    this.sprite.setVelocity(0, 0);
  }

  // 攻击
  attack() {
    if (!this.slimeData.active || this.isAttacking) return;
    this.gameInstance.slimeHitSound?.play();
    this.playAttackAnimation();
  }

  // 受伤
  takeDamage() {
    if (!this.slimeData.active) return;
    this.stopMoving();
    this.gameInstance.slimeHitSound?.play();
    this.slimeData.active = false;
    this.sprite.setVelocity(0, 0);
    this.playHitAnimation();
  }

  // 死亡
  die() {
    this.playDeathAnimation();
  }

  // 更新史莱姆数据
  updateSlimeData(newData) {
    this.slimeData = { ...this.slimeData, ...newData };
  }

  // 获取精灵
  getSprite() {
    return this.sprite;
  }

  // 获取史莱姆数据
  getSlimeData() {
    return this.slimeData;
  }

  // 销毁史莱姆
  destroy() {
    this.sprite.destroy();
  }

  // 检查是否存活
  isAlive() {
    return !!this.slimeData.active;
  }

  // 检查是否在攻击
  isAttackingNow() {
    return this.isAttacking;
  }

  // 检查是否在移动
  isMovingNow() {
    return this.isMoving;
  }
}
