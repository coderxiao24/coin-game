// 状态管理器
export default class GameState {
  constructor() {
    this.score = this.loadScore();
    this.coins = this.loadCoins();
    this.helpers = this.loadHelpers();
    this.slimes = this.loadSlimes();
    this.debouncedSave = this._throttle(this._saveToStorage.bind(this), 500);
    this.saveState();
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
    localStorage.setItem("coins", JSON.stringify(this.coins));
    localStorage.setItem("helpers", JSON.stringify(this.helpers));
    localStorage.setItem("slimes", JSON.stringify(this.slimes));
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
  addSlime(slime) {
    this.slimes.push(slime);
    this.saveState();
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
      localStorage.getItem("score") !== null ||
      localStorage.getItem("coins") !== null ||
      localStorage.getItem("helpers") !== null ||
      localStorage.getItem("slimes") !== null
    );
  }

  resetGame() {
    this.score = 0;
    this.coins = [];
    this.helpers = [];
    this.slimes = [];
    this.ensureSaved();
  }
}
