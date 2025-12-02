import GameConfig from "../core/GameConfig.js";

// 状态管理器
export default class GameState {
  constructor() {
    // 先初始化防抖函数
    this.debouncedSave = this._throttle(this._saveToStorage.bind(this), 500);

    // 然后加载状态
    this.score = this.loadScore();
    this.coins = this.loadCoins();
    this.helpers = this.loadHelpers();
    this.slimes = this.loadSlimes();
    this.currentLevel = this.loadCurrentLevel();

    // 使用setCurrentLevel来确保关卡配置正确初始化
    this.setCurrentLevel(this.currentLevel);
  }

  _throttle(func, delay) {
    let lastExecTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastExecTime >= delay) {
        func.apply(this, args); // this 指向调用者
        lastExecTime = now;
      }
    };
  }

  _saveToStorage() {
    localStorage.setItem("score", String(this.score));
    localStorage.setItem(
      "coins",
      JSON.stringify(this.coins.filter((v) => v.active !== false))
    );

    localStorage.setItem("helpers", JSON.stringify(this.helpers));
    localStorage.setItem(
      "slimes",
      JSON.stringify(this.slimes.filter((v) => v.active !== false))
    );
    localStorage.setItem("currentLevel", String(this.currentLevel));
    localStorage.setItem("levelTimeLeft", String(this.levelTimeLeft));
    localStorage.setItem("levelTargetScore", String(this.levelTargetScore));
  }

  loadScore() {
    const cacheScore = Number(localStorage.getItem("score"));
    return Number.isNaN(cacheScore) ? 0 : cacheScore;
  }

  loadCoins() {
    try {
      const cacheCoins = JSON.parse(localStorage.getItem("coins"));
      return cacheCoins && Array.isArray(cacheCoins) ? cacheCoins : [];
    } catch (error) {
      console.warn("Failed to load coins from localStorage:", error);
      return [];
    }
  }

  loadHelpers() {
    try {
      const cacheHelpers = JSON.parse(localStorage.getItem("helpers"));
      return cacheHelpers && Array.isArray(cacheHelpers) ? cacheHelpers : [];
    } catch (error) {
      console.warn("Failed to load helpers from localStorage:", error);
      return [];
    }
  }

  loadSlimes() {
    try {
      const cacheslimes = JSON.parse(localStorage.getItem("slimes"));
      return cacheslimes && Array.isArray(cacheslimes) ? cacheslimes : [];
    } catch (error) {
      console.warn("Failed to load cacheslimes from localStorage:", error);
      return [];
    }
  }

  // 关卡相关方法
  loadCurrentLevel() {
    const cacheLevel = Number(localStorage.getItem("currentLevel"));
    return Number.isNaN(cacheLevel) ? 1 : Math.max(1, cacheLevel);
  }

  loadLevelTimeLeft() {
    const cacheTime = Number(localStorage.getItem("levelTimeLeft"));
    return Number.isNaN(cacheTime)
      ? GameConfig.LEVEL_MODE.LEVEL_TIME
      : Math.max(0, cacheTime); // 默认3分钟
  }

  loadLevelTargetScore() {
    const cacheTarget = Number(localStorage.getItem("levelTargetScore"));
    if (!Number.isNaN(cacheTarget)) {
      return cacheTarget;
    }
    // 使用GameConfig中的第一关目标分数
    return this.getLevelConfig().FIRST_LEVEL_TARGET;
  }

  calculateLevelTargetScore(level) {
    const { FIRST_LEVEL_TARGET, TARGET_MULTIPLIER } = this.getLevelConfig();
    return FIRST_LEVEL_TARGET * Math.pow(TARGET_MULTIPLIER, level - 1);
  }

  getLevelConfig() {
    // 从GameConfig获取关卡配置
    return {
      LEVEL_TIME: GameConfig.LEVEL_MODE.LEVEL_TIME,
      FIRST_LEVEL_TARGET: GameConfig.LEVEL_MODE.FIRST_LEVEL_TARGET,
      TARGET_MULTIPLIER: GameConfig.LEVEL_MODE.TARGET_MULTIPLIER,
      MAX_LEVEL: GameConfig.LEVEL_MODE.MAX_LEVEL,
    };
  }

  setCurrentLevel(level) {
    this.currentLevel = Math.max(1, level);
    this.levelTargetScore = this.calculateLevelTargetScore(this.currentLevel);
    this.levelTimeLeft = this.getLevelConfig().LEVEL_TIME;
    this.saveState();
  }

  setLevelTimeLeft(time) {
    this.levelTimeLeft = Math.max(0, time);
    this.saveState();
  }

  setLevelTargetScore(target) {
    this.levelTargetScore = target;
    this.saveState();
  }

  resetLevel() {
    this.setCurrentLevel(1);
    this.score = 0;
    this.coins = [];
    this.helpers = [];
    this.slimes = [];
    this.saveState();
  }

  nextLevel() {
    this.setCurrentLevel(this.currentLevel + 1);
  }

  isLevelCompleted() {
    return this.score >= this.levelTargetScore;
  }

  getLevelProgress() {
    if (this.levelTargetScore <= 0) return 1;
    return Math.min(1, this.score / this.levelTargetScore);
  }

  saveState() {
    this.debouncedSave();
  }

  addHelper(helper) {
    this.helpers.push(helper);
    this.saveState();
  }

  addCoin(coin) {
    this.coins.push(coin);
    this.saveState();
  }

  delCoin(coin) {
    const idx = this.coins.findIndex((item) => item === coin);
    if (idx >= 0) {
      this.coins.splice(idx, 1);
      this.saveState();
    }
  }

  addSlime(slime) {
    this.slimes.push(slime);
    this.saveState();
  }

  delSlime(slime) {
    const idx = this.slimes.findIndex((item) => item === slime);
    if (idx >= 0) {
      this.slimes.splice(idx, 1);
      this.saveState();
    }
  }

  setScore(value) {
    this.score = value;
    this.saveState();
  }

  ensureSaved() {
    this.debouncedSave = () => {};
    this._saveToStorage();
  }

  hasSaveData() {
    return (
      localStorage.getItem("score") !== "0" ||
      localStorage.getItem("coins") !== "[]" ||
      localStorage.getItem("helpers") !== "[]" ||
      localStorage.getItem("slimes") !== "[]"
    );
  }

  resetGame() {
    this.score = 0;
    this.coins = [];
    this.helpers = [];
    this.slimes = [];
    this.currentLevel = 1;
    this.levelTimeLeft = this.getLevelConfig().LEVEL_TIME;
    this.ensureSaved();
  }
}
