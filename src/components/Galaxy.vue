<template>
  <div>
    <canvas
      ref="canvas"
      class="ma-3"
    />
    <v-card
      width="400"
      class="ma-3"
    >
      <v-card-text>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="width"
              dense
              label="width"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="height"
              dense
              label="height"
            />
          </v-col>
        </v-row>
        <v-btn
          @click="generate"
        >
          Generate
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import state from '@/state';
import * as Three from '@/three';

const PLANETARY_DISTANCE = 5;
const CLUSTER_STRENGTH = 0.85;
const SYSTEM_COUNT = 20000;
const BOUNDARY = 2000;
const BOUNDARY_ = -1 * BOUNDARY;

const SPIRAL = true;
const SPIRAL_COUNT = 4;
const SPIRAL_DISTANCE = 300;
const SPIRAL_COILS = 1.5;

const INITIAL_POS = 0;

function inCircle (centerX, centerY, radius, x, y) {
  const dist = Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2);
  return dist <= Math.pow(radius, 2);
}

function random (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export default {
  name: 'Galaxy',
  data () {
    return {
      state,
      canvasWidth: 750,
      canvasHeight: 600,
      width: 100,
      height: 100,
      terrain: null,
      aspect: 0,
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      needsRender: true,
      plane: null,
      systems: [],
      positions: {},
      vertices: [],
    };
  },
  mounted () {
    const canvas = this.$refs.canvas;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    canvas.style.width = `${ this.canvasWidth }px`;
    canvas.style.height = `${ this.canvasHeight }px`;

    Three.Object3D.DefaultUp = new Three.Vector3(0, 0, 1);

    this.renderer = new Three.WebGLRenderer({
      antialias: true, canvas: this.$refs.canvas,
    });
    this.renderer.setSize(this.canvasWidth, this.canvasHeight);
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.clear(true, true, true);

    this.scene = new Three.Scene();
    // this.scene.add(new Three.HemisphereLight(0xffffff, 0xbbbbbb, 1));
    this.scene.add(new Three.AmbientLight(0xffffff));

    this.camera = new Three.PerspectiveCamera(60, this.canvasWidth / this.canvasHeight, 0.00001, 100000);
    this.camera.position.set(-500, -500, 500);

    this.controls = new Three.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.needsRender = true;
    });
    this.controls.update();

    this.generate();

    this.animate();
  },
  methods: {
    generate () {
      this.systems = [];
      this.positions = {};
      this.vertices = [];

      const initialX = INITIAL_POS;
      const initialY = INITIAL_POS;
      const initial = this.systemGenerator(initialX, initialY);

      this.systems.push(initial);
      this.setPosition(initialX, initialY, initial);

      this.minX = 0;
      this.minY = 0;
      this.maxX = 0;
      this.maxY = 0;

      const clusterCount = Math.floor(Math.pow(PLANETARY_DISTANCE * 2 + 1, 2) * CLUSTER_STRENGTH);

      console.log('Generating galaxy...');

      if (SPIRAL) {
        for (let i = 0; i < SPIRAL_COUNT; i++) {
          this.spiralGenerator(initialX, initialY,
            SPIRAL_DISTANCE,
            SPIRAL_COILS,
            360 * i);
        }
      }

      const possibilities = this.systems.slice(0);

      for (let i = possibilities.length; i < SYSTEM_COUNT; i++) {
        const index = random(0, possibilities.length - 1);
        const neighbor = possibilities[index];

        if (!neighbor) {
          console.log('FAULT', index, possibilities.length);
          i--;
          possibilities.splice(index, 1);
          continue;
        }

        const candidates = [];

        const cornerX = neighbor.x - PLANETARY_DISTANCE;
        const cornerY = neighbor.y - PLANETARY_DISTANCE;
        const dist = PLANETARY_DISTANCE * 2;

        for (let x = cornerX; x <= cornerX + dist; x++) {
          for (let y = cornerY; y <= cornerY + dist; y++) {
            if (this.safePosition(x, y) && !this.getPosition(x, y) &&
              !inCircle(neighbor.x, neighbor.y, 1.2, x, y)) {
              candidates.push({
                x,
                y,
              });
            }
          }
        }

        if (candidates.length < clusterCount) {
          i--;
          possibilities.splice(index, 1);
          continue;
        } else {
          const position = candidates[random(0, candidates.length - 1)];

          const newSystem = this.createSystem(position);
          possibilities.push(newSystem);
        }
      }

      const geometry = new Three.BufferGeometry();
      geometry.setAttribute('position', new Three.Float32BufferAttribute(this.vertices, 3));

      const material = new Three.PointsMaterial({ color: 0x888888 });

      const points = new Three.Points(geometry, material);

      console.log('done.');

      this.scene.add(points);
      this.needsRender = true;
    },
    animate () {
      this.controls.update();

      if (this.needsRender) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }

      requestAnimationFrame(this.animate);
    },
    setPosition (x, y, system) {
      this.positions[`${ x },${ y }`] = system;
    },
    getPosition (x, y) {
      return this.positions[`${ x },${ y }`];
    },
    safePosition (x, y) {
      if (x > BOUNDARY || x < BOUNDARY_) {
        return false;
      }

      if (y > BOUNDARY || y < BOUNDARY_) {
        return false;
      }

      /*
        if (Math.abs(x) < BLACKHOLE_RADIUS && Math.abs(y) < BLACKHOLE_RADIUS &&
        inCircle(0, 0, BLACKHOLE_RADIUS, x, y)) {
        return false;
        }
      */
      /*
        if ((x > -50 && x < 50) && (y > -50 && y < 50)) {
        return false;
        }
      */
      return true;
    },
    createSystem (position) {
      const newSystem = this.systemGenerator(position.x, position.y);
      this.setPosition(position.x, position.y, newSystem);
      this.systems.push(newSystem);

      this.minX = Math.min(this.minX, position.x);
      this.minY = Math.min(this.minY, position.y);
      this.maxX = Math.max(this.maxX, position.x);
      this.maxY = Math.max(this.maxY, position.y);

      return newSystem;
    },
    systemGenerator (x, y) {
      const system = {
        id: 0,
        planets: [],
        x,
        y,
      };

      this.vertices.push(x, y, 0);

      return system;
    },
    spiralGenerator (centerX, centerY, radius, coils, rotation) {
      const thetaMax = coils * 2 * Math.PI;

      const awayStep = radius / thetaMax;

      const chord = 10;

      for (let theta = chord / awayStep; theta <= thetaMax;) {
        const away = awayStep * theta;
        const around = theta + rotation;
        const x = Math.round(centerX + Math.cos(around) * away);
        const y = Math.round(centerY + Math.sin(around) * away);

        if (this.safePosition(x, y) && !this.getPosition(x, y)) {
          this.createSystem({
            x,
            y,
          });
        }

        const delta = (-2 * away + Math.sqrt(4 * away * away + 8 * awayStep * chord)) /
          (2 * awayStep);
        theta += delta;
      }
    },
  },
};
</script>
