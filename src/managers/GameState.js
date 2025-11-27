// 状态管理器
export default class GameState {
  constructor() {
    this.score = this.loadScore();
    this.coins = this.loadCoins();
    this.helpers = this.loadHelpers();
    this.debouncedSave = this._debounce(this._saveToStorage.bind(this), 500);
    this.saveState();
  }

  _debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  _saveToStorage() {
    localStorage.setItem("score", String(this.score));
    localStorage.setItem("coins", JSON.stringify(this.coins));
    localStorage.setItem("helpers", JSON.stringify(this.helpers));
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
      localStorage.getItem("helpers") !== null
    );
  }

  resetGame() {
    this.score = 0;
    this.coins = [];
    this.helpers = [];
    this.ensureSaved();
  }
}
