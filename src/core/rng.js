/**
 * @class RNG
 * @description A deterministic Pseudo-Random Number Generator (PRNG) using Mulberry32.
 */
export class RNG {
    /**
     * Creates a new RNG instance.
     * @param {number} seed - The initial seed.
     */
    constructor(seed = Date.now()) {
        this._seed = seed;
        this.state = seed;
    }

    /**
     * Resets the RNG with a new seed.
     * @param {number} seed
     */
    seed(seed) {
        this._seed = seed;
        this.state = seed;
    }

    /**
     * Generates the next random floating-point number between 0 (inclusive) and 1 (exclusive).
     * @returns {number}
     */
    next() {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Generates a random integer between min and max (inclusive).
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Alias for next() to match Math.random() signature.
     * @returns {number}
     */
    random() {
        return this.next();
    }
}

// Global instance for the application
export const rng = new RNG();
