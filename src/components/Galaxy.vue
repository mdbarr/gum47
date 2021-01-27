<template>
  <div>
    <canvas
      ref="canvas"
      class="ma-3"
    />
    <v-card
      :width="width"
      class="ma-3 pa-1"
    >
      <v-card-text>
        <v-row>
          <v-col cols="3">
            <v-text-field
              v-model.number="width"
              dense
              label="Width"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="height"
              dense
              label="Height"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="initialX"
              dense
              label="Initial X"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="initialY"
              dense
              label="Initial Y"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <v-text-field
              v-model.number="systemCount"
              dense
              label="System Count"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="clusterStrength"
              dense
              label="Cluster Strength"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="planetaryDistance"
              dense
              label="Planetary Distance"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="boundary"
              dense
              label="Boundary"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="3">
            <v-checkbox
              v-model="spiral"
              dense
              hide-details
              label="Spiral Galaxy"
              class="pa-0 mt-0"
              color="#0073b1"
              small
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="spiralCount"
              :disabled="!spiral"
              dense
              label="Spiral Count"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="spiralCoils"
              :disabled="!spiral"
              dense
              label="Spiral Coils"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="spiralDistance"
              :disabled="!spiral"
              dense
              label="Spiral Distance"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn
          block
          color="#0073b1"
          @click="generate"
        >
          Generate
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import state from '@/state';
import * as Three from '@/three';

//////////

const vertexShader = `
attribute vec4 color;
varying vec4 vColor;

void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 3.0;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}
`;

//////////

const STELLAR_TYPES = [
  {
    type: 'B',
    size: 'super giant',
    occurrence: 0.00001,
  },
  {
    type: 'A',
    size: 'super giant',
    occurrence: 0.00001,
  },
  {
    type: 'F',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    type: 'G',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    type: 'K',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    type: 'M',
    size: 'super giant',
    occurrence: 0.00002,
  },

  {
    type: 'F',
    size: 'giant',
    occurrence: 0.0004,
  },
  {
    type: 'G',
    size: 'giant',
    occurrence: 0.0005,
  },
  {
    type: 'K',
    size: 'giant',
    occurrence: 0.0045,
  },
  {
    type: 'M',
    size: 'giant',
    occurrence: 0.00045,
  },
  {
    type: 'C',
    size: 'giant',
    occurrence: 0.001,
  },
  {
    type: 'S',
    size: 'giant',
    occurrence: 0.01,
  },

  {
    type: 'O',
    size: 'main sequence',
    occurrence: 0.0001,
  },
  {
    type: 'B',
    size: 'main sequence',
    occurrence: 0.0099,
  },
  {
    type: 'A',
    size: 'main sequence',
    occurrence: 0.02,
  },
  {
    type: 'F',
    size: 'main sequence',
    occurrence: 0.04,
  },
  {
    type: 'G',
    size: 'main sequence',
    occurrence: 0.08,
  },
  {
    type: 'K',
    size: 'main sequence',
    occurrence: 0.15,
  },
  {
    type: 'M',
    size: 'main sequence',
    occurrence: 0.60,
  },

  {
    type: 'B',
    size: 'white dwarf',
    occurrence: 0.01,
  },
  {
    type: 'A',
    size: 'white dwarf',
    occurrence: 0.02,
  },
  {
    type: 'F',
    size: 'white dwarf',
    occurrence: 0.02,
  },
  {
    type: 'G',
    size: 'white dwarf',
    occurrence: 0.01,
  },
  {
    type: 'K',
    size: 'white dwarf',
    occurrence: 0.0095,
  },

  {
    type: 'L',
    size: 'dwarf',
    occurrence: 0.001,
  },
  {
    type: 'T',
    size: 'dwarf',
    occurrence: 0.001,
  },

  {
    type: 'P',
    size: 'nebula',
    occurrence: 0.01,
  },

  {
    type: 'NS',
    size: 'neutron star',
    occurrence: 0.00045,
  },
  {
    type: 'BH',
    size: 'black hole',
    occurrence: 0.00005,
  },

];

/*
var sum = 0;
for (var i = 0; i < STELLAR_TYPES.length; i++) {
  sum += STELLAR_TYPES[i].occurrence;
}
console.log('OCCURRENCE SUM', sum);
*/

const STELLAR_COLORS = {
  W: new Three.Color(0xaabfff),
  O: new Three.Color(0x9bb0ff),
  B: new Three.Color(0xaabfff),
  A: new Three.Color(0xcad7ff),
  F: new Three.Color(0xf8f7ff),
  G: new Three.Color(0xfff4ea),
  K: new Three.Color(0xffd2a1),
  M: new Three.Color(0xffcc6f),
  C: new Three.Color(0xff5300),
  S: new Three.Color(0xff9303),
  L: new Three.Color(0xe817b9),
  T: new Three.Color(0x3e0303),
  D: new Three.Color(0x828ba4),
  P: new Three.Color(0x00ffec),
  NS: new Three.Color(0xffffff),
  BH: new Three.Color(0x000000),
};

function stellarGenerator () {
  const accuracy = 100000000;
  const type = random(0, accuracy);
  let index = STELLAR_TYPES.length - 1;

  for (let i = 0, perc = 0; i < STELLAR_TYPES.length; i++) {
    perc += Math.ceil(accuracy * STELLAR_TYPES[i].occurrence);
    if (type < perc) {
      index = i;
      break;
    }
  }

  const stellarType = STELLAR_TYPES[index].type;

  const sun = {
    type: stellarType,
    size: STELLAR_TYPES[index].size,
    color: STELLAR_COLORS[stellarType],
  };
  return sun;
}

//////////

function inCircle (centerX, centerY, radius, x, y) {
  const dist = Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2);
  return dist <= Math.pow(radius, 2);
}

function random (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function randomFloat (min, max) {
  return Math.random() * (max - min) + min;
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
      width: 800,
      height: 600,
      aspect: 0,
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      needsRender: true,
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
      boundary: 2000,
      clusterStrength: 0.90,
      initialX: 0,
      initialY: 0,
      planetaryDistance: 7,
      spiral: true,
      spiralCoils: 1.5,
      spiralCount: 4,
      spiralDistance: 400,
      systemCount: 50000,
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

    this.camera = new Three.PerspectiveCamera(60, this.width / this.height, 0.000001, 100000);
    this.camera.position.set(-550, -550, 550);

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

      console.log('Generating galaxy...');
      const start = Date.now();

      const initial = this.systemGenerator(this.initialX, this.initialY);

      this.systems.push(initial);
      this.setPosition(this.initialX, this.initialY, initial);

      this.minX = 0;
      this.minY = 0;
      this.maxX = 0;
      this.maxY = 0;

      const clusterCount = Math.floor(Math.pow(this.planetaryDistance * 2 + 1, 2) * this.clusterStrength);

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

      const numColors = this.geometry.attributes.position.count * 4;
      const colors = new Float32Array(Number(numColors));

      for (let i = 0, n = 0; i < numColors; i += 4, n++) {
        const color = this.systems[n].sun.color;
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
        colors[i + 3] = Math.random();
      }

      this.geometry.setAttribute('color', new Three.BufferAttribute(colors, 4));

      this.material = new Three.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
      });

      this.galaxy = new Three.Points(this.geometry, this.material);

      console.log('done. %dms', Date.now() - start);

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
      if (x > this.boundary || x < -this.boundary) {
        return false;
      }

      if (y > this.boundary || y < -this.boundary) {
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
      const dist = Math.sqrt(Math.pow(this.initialX - x, 2) + Math.pow(this.initialY - y, 2)) / 2;
      let z = Math.min((1 / dist) * this.spiralDistance, 25) * 2;
      z = randomFloat(-z, z) || 0;

      const system = {
        id: this.vertices.length / 3,
        sun: stellarGenerator(),
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

<style>
.v-input--checkbox .v-label {
  font-size: 14px !important;
}
</style>
