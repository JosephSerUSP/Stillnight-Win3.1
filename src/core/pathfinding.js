
/**
 * Finds a path from start to end using Breadth-First Search.
 * Returns an array of coordinates [{x,y}, {x,y}, ...] representing the path (including start and end).
 * If no path is found, returns an empty array.
 *
 * @param {number} width - The width of the grid.
 * @param {number} height - The height of the grid.
 * @param {Function} isWalkable - Function(x, y) returning true if the tile is passable.
 * @param {Object} start - Starting coordinate {x, y}.
 * @param {Object} end - Target coordinate {x, y}.
 * @returns {Array} The path.
 */
export function findPath(width, height, isWalkable, start, end) {
  const queue = [start];
  const cameFrom = {};
  const key = (x, y) => `${x},${y}`;

  cameFrom[key(start.x, start.y)] = null;

  let current = null;

  while (queue.length > 0) {
    current = queue.shift();

    if (current.x === end.x && current.y === end.y) {
      break;
    }

    const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
    ];

    for (const next of neighbors) {
      if (next.x >= 0 && next.x < width && next.y >= 0 && next.y < height) {
         if (!cameFrom.hasOwnProperty(key(next.x, next.y))) {
             // For the end node, we don't check isWalkable (it might be the player/target)
             // But usually we do. However, if the target is "blocked" (e.g. player stands there),
             // and we want to path TO them, we must allow it.
             const isTarget = next.x === end.x && next.y === end.y;
             if (isTarget || isWalkable(next.x, next.y)) {
                 queue.push(next);
                 cameFrom[key(next.x, next.y)] = current;
             }
         }
      }
    }
  }

  // If we didn't reach the end
  if (!current || (current.x !== end.x || current.y !== end.y)) {
      return [];
  }

  // Reconstruct path
  const path = [];
  while (current) {
      path.push(current);
      current = cameFrom[key(current.x, current.y)];
  }
  return path.reverse();
}
