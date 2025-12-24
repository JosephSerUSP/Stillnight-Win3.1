import * as THREE from 'three';

/**
 * @class TransitionManager
 * @description Manages fullscreen visual transitions using WebGL (Three.js) and CSS.
 */
export class TransitionManager {
    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'transition-overlay';
        this.overlay.style.position = 'fixed';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.width = '100%';
        this.overlay.style.height = '100%';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.zIndex = '10000'; // Topmost
        document.body.appendChild(this.overlay);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.overlay.appendChild(this.renderer.domElement);

        this.uniforms = {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uType: { value: 0 }, // 0: None, 1: Battle Cut-In, 2: Map Wipe, 3: Fade Black
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            transparent: true,
            depthTest: false,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uProgress;
                uniform int uType;
                uniform float uTime;
                uniform vec2 uResolution;
                varying vec2 vUv;

                // Simple pseudo-random
                float rand(vec2 co){
                    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    vec4 color = vec4(0.0, 0.0, 0.0, 0.0);

                    if (uType == 1) { // Battle Intro (Horizontal Cut-In)
                        // Black screen that opens horizontally from center
                        float center = 0.5;
                        float opening = uProgress * 0.55; // Max opening half-height
                        float dist = abs(vUv.y - center);

                        // Add some noise to the edge
                        float edgeNoise = rand(vec2(vUv.x, uTime)) * 0.01;

                        // If dist < opening, transparent (reveal). Else Black.
                        if (dist < opening + edgeNoise) {
                            color = vec4(0.0, 0.0, 0.0, 0.0);
                        } else {
                            color = vec4(0.0, 0.0, 0.0, 1.0);
                        }
                    }
                    else if (uType == 2) { // Map Wipe (Diagonal Swipe)
                        // Diagonal swipe
                        // val range 0.0 to 2.0
                        float val = vUv.x + vUv.y;

                        // Distortion component for the swipe edge
                        float distortion = sin(vUv.y * 20.0 + uTime * 5.0) * 0.05;

                        // Progress 0 -> 1: Screen fills with black (Fade Out)
                        // Progress 1 -> 0: Screen clears (Fade In)
                        // We use uProgress directly.
                        // If uProgress goes 0 -> 1:
                        // We want black to cover screen.
                        // So black if val < threshold?
                        // If uProgress=0, threshold should be < 0 (all transparent)
                        // If uProgress=1, threshold should be > 2 (all black)
                        float threshold = uProgress * 3.0 - 0.5;

                        if (val + distortion < threshold) {
                             color = vec4(0.0, 0.0, 0.0, 1.0);
                        } else {
                             color = vec4(0.0, 0.0, 0.0, 0.0);
                        }
                    }
                    else if (uType == 3) { // Simple Fade
                        color = vec4(0.0, 0.0, 0.0, uProgress);
                    }

                    gl_FragColor = color;
                }
            `
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.container = document.getElementById('game-container'); // To apply CSS transforms

        window.addEventListener('resize', () => {
             this.renderer.setSize(window.innerWidth, window.innerHeight);
             this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        });

        this.isRunning = true;
        this.animate();
    }

    animate(time) {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate.bind(this));

        this.uniforms.uTime.value = time * 0.001;
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Swirl blur + Fade out (Battle Start)
     */
    async runBattleTransition() {
        // 1. CSS Swirl on container
        if (this.container) {
            this.container.style.transition = 'transform 1.0s ease-in, opacity 1.0s ease-in';
            this.container.style.transformOrigin = 'center';
            this.container.style.transform = 'scale(0.1) rotate(720deg)';
            this.container.style.opacity = '0';
        }

        // 2. WebGL Fade to Black
        this.uniforms.uType.value = 3;
        // Start fading in black overlay halfway through swirl
        await this.delay(500);
        await this.animateUniform(0, 1, 500); // Fade to full black

        // Reset Container logic (hidden) happens in caller or intro
    }

    /**
     * Battle Intro: Cut-in reveal + Camera Move
     */
    async runBattleIntro() {
        // Reset Container styles first (it was swirled out)
        if (this.container) {
            this.container.style.transition = 'none';
            this.container.style.opacity = '1';
            // Set Start Position for "Camera" (CSS 3D)
            // Camera rises (translateY goes up? No, scene moves down)
            // Rotate around battlefield
            this.container.style.transform = 'perspective(800px) rotateX(40deg) rotateZ(10deg) scale(1.5) translateY(100px)';
            this.container.style.filter = 'brightness(0.5)'; // Dim initial
        }

        // Set Shader to Cut-in mode, fully closed (Black)
        this.uniforms.uType.value = 1;
        this.uniforms.uProgress.value = 0;

        // Force reflow
        void this.container.offsetWidth;

        // Animate!
        const duration = 2500;

        // CSS Transition for Camera Move (Ease into normal)
        this.container.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.2, 1), filter ${duration}ms ease-out`;
        this.container.style.transform = 'perspective(800px) rotateX(0deg) rotateZ(0deg) scale(1) translateY(0px)';
        this.container.style.filter = 'brightness(1)';

        // WebGL Transition for Cut-in (Open eyes)
        await this.animateUniform(0, 1, duration * 0.8);

        // Cleanup
        this.uniforms.uType.value = 0; // Clear overlay
        this.container.style.transition = '';
        this.container.style.transform = '';
    }

    /**
     * Map Transfer: Diagonal Swipe Out (Distort)
     */
    async runMapTransitionOut() {
        this.uniforms.uType.value = 2; // Diagonal
        await this.animateUniform(0, 1, 600);
    }

    /**
     * Map Transfer: Diagonal Swipe In
     */
    async runMapTransitionIn() {
        this.uniforms.uType.value = 2; // Diagonal
        // Run backwards from Black (1) to Clear (0)
        // Note: Shader logic: if val < threshold (progress*3 - 0.5) -> Black.
        // If progress=1, threshold=2.5. All Black.
        // If progress=0, threshold=-0.5. All Clear.
        // So we animate 1 -> 0.
        await this.animateUniform(1, 0, 600);
        this.uniforms.uType.value = 0;
    }

    animateUniform(start, end, duration) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const animate = (time) => {
                const elapsed = time - startTime;
                const t = Math.min(elapsed / duration, 1);
                // Ease In Out
                // const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                // Linear for progress usually better controlled by logic, but let's use Linear
                this.uniforms.uProgress.value = start + (end - start) * t;
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    delay(ms) {
        return new Promise(res => setTimeout(res, ms));
    }
}
