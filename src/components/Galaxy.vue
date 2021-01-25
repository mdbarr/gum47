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

const vertexShader = `
attribute float alpha;
varying float vAlpha;

void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 2.5;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform vec3 color;
varying float vAlpha;

void main() {
    gl_FragColor = vec4( color, vAlpha );
}
`;

function inCircle (centerX, centerY, radius, x, y) {
  const dist = Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2);
  return dist <= Math.pow(radius, 2);
}

function random (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function vary (number, percent) {
  const difference = Math.floor(number * (percent / 100));
  const amount = random(-difference, difference);

  return number + amount;
}

export default {
  name: 'Galaxy',
  data () {
    return {
      state,
      width: 750,
      height: 600,
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
      geometry: null,
      material: null,
      galaxy: null,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      planetaryDistance: 7,
      clusterStrength: 0.90,
      systemCount: 25000,
      boundary: 2000,
      bounary_: -2000,
      spiral: true,
      spiralCount: 4,
      spiralDistance: 300,
      spiralCoils: 1.5,
      initialX: 0,
      initialY: 0,
    };
  },
  mounted () {
    const canvas = this.$refs.canvas;
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.width = `${ this.width }px`;
    canvas.style.height = `${ this.height }px`;

    Three.Object3D.DefaultUp = new Three.Vector3(0, 0, 1);

    this.renderer = new Three.WebGLRenderer({
      antialias: true, canvas: this.$refs.canvas,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x031228, 1);
    this.renderer.clear(true, true, true);

    this.scene = new Three.Scene();
    // this.scene.add(new Three.HemisphereLight(0xffffff, 0xbbbbbb, 1));
    // this.scene.add(new Three.AmbientLight(0xffffff));

    this.camera = new Three.PerspectiveCamera(60, this.width / this.height, 0.00001, 100000);
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
      if (this.galaxy) {
        this.scene.remove(this.galaxy);
      }

      if (this.geometry) {
        this.geometry.dispose();
      }

      if (this.material) {
        this.material.dispose();
      }

      this.systems = [];
      this.positions = {};
      this.vertices = [];

      const initial = this.systemGenerator(this.initialX, this.initialY);

      this.systems.push(initial);
      this.setPosition(this.initialX, this.initialY, initial);

      this.minX = 0;
      this.minY = 0;
      this.maxX = 0;
      this.maxY = 0;

      const clusterCount = Math.floor(Math.pow(this.planetaryDistance * 2 + 1, 2) * this.clusterStrength);

      console.log('Generating galaxy...');

      if (this.spiral) {
        for (let i = 0; i < this.spiralCount; i++) {
          this.spiralGenerator(this.initialX, this.initialY, vary(this.spiralDistance, 5),
            this.spiralCoils, 360 * i);
        }
      }

      const possibilities = this.systems.slice(0);

      for (let i = possibilities.length; i < this.systemCount; i++) {
        const index = random(0, possibilities.length - 1);
        const neighbor = possibilities[index];

        if (!neighbor) {
          console.log('FAULT', index, possibilities.length);
          i--;
          possibilities.splice(index, 1);
          continue;
        }

        const candidates = [];

        const cornerX = neighbor.x - this.planetaryDistance;
        const cornerY = neighbor.y - this.planetaryDistance;
        const dist = this.planetaryDistance * 2;

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

      this.geometry = new Three.BufferGeometry();
      this.geometry.setAttribute('position', new Three.Float32BufferAttribute(this.vertices, 3));

      const numVertices = this.geometry.attributes.position.count;
      const alphas = new Float32Array(Number(numVertices)); // 1 values per vertex

      for (let i = 0; i < numVertices; i++) {
        alphas[i] = Math.random();
      }

      this.geometry.setAttribute('alpha', new Three.BufferAttribute(alphas, 1));

      const uniforms = { color: { value: new Three.Color(0xffffff) } };

      this.material = new Three.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
      });

      this.galaxy = new Three.Points(this.geometry, this.material);

      console.log('done.');

      this.scene.add(this.galaxy);
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
      if (x > this.boundary || x < this.boundary_) {
        return false;
      }

      if (y > this.boundary || y < this.boundary_) {
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
    systemGenerator (x, y, z = random(-2, 2)) {
      const system = {
        id: 0,
        planets: [],
        x,
        y,
        z,
      };

      this.vertices.push(x, y, z);

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
