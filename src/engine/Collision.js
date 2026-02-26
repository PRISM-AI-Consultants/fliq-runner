// Lane-based collision detection for the runner
// Simple and efficient - no full physics engine needed
import { CONFIG } from '../config.js';

export class Collision {
  // Check if player overlaps an entity based on lane + Z position
  static checkLaneCollision(player, entity) {
    // Same lane?
    if (player.lane !== entity.lane) return false;

    // Z overlap (forward/backward)
    const playerFront = player.z - player.depth / 2;
    const playerBack = player.z + player.depth / 2;
    const entityFront = entity.z - entity.depth / 2;
    const entityBack = entity.z + entity.depth / 2;

    return playerFront < entityBack && playerBack > entityFront;
  }

  // Check if player is within range of an entity (for collectibles)
  static checkProximity(player, entity, range = 1.5) {
    const dx = player.x - entity.x;
    const dz = player.z - entity.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < range;
  }

  // Check if player has passed an entity (for cleanup)
  static hasPassed(player, entity, buffer = 5) {
    return entity.z > player.z + buffer;
  }

  // Check vertical collision (for jump-over obstacles)
  static isAbove(player, entity) {
    return player.y > entity.height;
  }

  // Check if player is sliding under an obstacle
  static isSlidingUnder(player, entity) {
    return player.isSliding && entity.requiresSlide;
  }

  // Full collision check for obstacles
  static checkObstacleHit(player, obstacle) {
    // Not in same lane
    if (!this.checkLaneCollision(player, obstacle)) return false;

    // Player jumped over
    if (obstacle.canJumpOver && this.isAbove(player, obstacle)) return false;

    // Player slid under
    if (obstacle.canSlideUnder && this.isSlidingUnder(player, obstacle)) return false;

    return true;
  }
}
