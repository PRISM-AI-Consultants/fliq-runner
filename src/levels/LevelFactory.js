// Level factory - loads level configs and creates LevelBase instances
import { LevelBase } from './LevelBase.js';
import { LEVELS, getLevelConfig } from '../data/levels.js';

export class LevelFactory {
  static createLevel(game, levelIndex) {
    const config = getLevelConfig(levelIndex);
    return new LevelBase(game, config);
  }

  static getTotalLevels() {
    return LEVELS.length;
  }

  static getLevelName(levelIndex) {
    const config = getLevelConfig(levelIndex);
    return config.name;
  }

  static getLevelDescription(levelIndex) {
    const config = getLevelConfig(levelIndex);
    return config.description;
  }
}
