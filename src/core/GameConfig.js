// 配置管理器
export default class GameConfig {
  static get SAFE_MARGIN() {
    return 20;
  }
  static get WIDTH() {
    return 300;
  }
  static get SHOP_WIDTH() {
    return 100;
  }
  static get HEIGHT() {
    return 800;
  }
  static get DOLLAR_COLOR() {
    return "#E39500";
  }

  static get COIN_TYPES() {
    return {
      COPPER: {
        name: "copper",
        basePrice: 5,
        value: 1,
      },
      SILVER: {
        name: "silver",
        basePrice: 50,
        value: 10,
      },
      GOLD: {
        name: "gold",
        basePrice: 500,
        value: 100,
      },
    };
  }

  static get HELPER() {
    return {
      basePrice: 50,
    };
  }

  static get ANIMATION() {
    return {
      HELPER_FRAME_RATE: 12,
      SLIME_FRAME_RATE: 10,
      SPIN_FRAME_RATE: 18,
      FLASH_FRAME_RATE: 12,
      SPIN_DURATION: 500,
      FLASH_DURATION: 2000,
    };
  }

  // 关卡模式配置
  static get LEVEL_MODE() {
    return {
      ENABLED: true, // 启用关卡模式
      LEVEL_TIME: 60, // 每关时间（秒）
      FIRST_LEVEL_TARGET: 25, // 第一关目标分数
      TARGET_MULTIPLIER: 2, // 每关目标分数乘数
      MAX_LEVEL: 999, // 最大关卡数
    };
  }
}
