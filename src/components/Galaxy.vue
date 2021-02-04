<template>
  <div>
    <v-snackbar
      v-model="snackbar"
      :timeout="5000"
      color="red darken-3"
      top
    >
      Failed to generate galaxy with given parameters
      <template #action="{ attrs }">
        <v-btn
          icon
          small
          v-bind="attrs"
          @click="snackbar = false"
        >
          <v-icon small>
            mdi-close
          </v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <canvas
      ref="canvas"
      class="ma-3"
      @click="clicked"
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
          :loading="loading"
          @click="regenerate"
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
import TWEEN from '@tweenjs/tween.js';

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
  O: new Three.Color(0x0071c1),
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
  BH: new Three.Color(0x111111),
};

const STELLAR_SIZES = {
  'super giant': [ 3, 3, 3 ],
  giant: [ 2, 2, 2 ],
  'main sequence': [ 1, 1, 1 ],
  'white dwarf': [ 0.75, 0.75, 0.75 ],
  dwarf: [ 0.5, 0.5, 0.5 ],
  nebula: [ 1, 1, 1 ],
  'neutron star': [ 0.25, 0.25, 0.25 ],
  'black hole': [ 0.1, 0.1, 0.1 ],
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
    size: STELLAR_SIZES[STELLAR_TYPES[index].size],
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
      loading: false,
      width: 1000,
      height: 600,
      aspect: 0,
      renderer: null,
      scene: null,
      camera: null,
      controls: null,
      raycaster: null,
      renderScene: null,
      bloomPass: null,
      composer: null,
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
      spiralDistance: 350,
      systemCount: 20000,
      bloom: {
        radius: 0,
        strength: 1,
        threshold: 0,
      },
      loader: null,
      texture: null,
      clouds: [],
      snackbar: false,
      tween: null,
    };
  },
  async mounted () {
    this.loading = true;

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
    this.renderer.setClearColor(0, 1);
    this.renderer.clear(true, true, true);

    this.scene = new Three.Scene();
    this.scene.add(new Three.HemisphereLight(0xffffff, 0xbbbbbb, 1));
    // this.scene.add(new Three.AmbientLight(0xffffff));

    this.camera = new Three.PerspectiveCamera(60, this.width / this.height, 0.000000001, 100000000);
    this.camera.position.set(0, -15000, 0);

    this.controls = new Three.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.needsRender = true;
    });
    // this.controls.autoRotate = true;
    this.controls.update();

    this.raycaster = new Three.Raycaster();

    this.renderScene = new Three.RenderPass(this.scene, this.camera);
    this.bloomPass = new Three.UnrealBloomPass(new Three.Vector2(window.innerWidth, window.innerHeight),
      this.bloom.strength,
      this.bloom.radius,
      this.bloom.threshold);

    this.composer = new Three.EffectComposer(this.renderer);
    this.composer.addPass(this.renderScene);
    this.composer.addPass(this.bloomPass);

    this.loader = new Three.TextureLoader();

    this.texture = await this.asyncLoad(this.loader, 'smoke-v2.png');

    this.generate();

    this.animate();

    this.loading = false;
  },
  methods: {
    clicked (event) {
      const position = {
        x: (event.offsetX / this.width) * 2 - 1,
        y: -(event.offsetY / this.height) * 2 + 1,
      };

      console.log('event', event);
      console.log('position', position, event.x, event.y);

      this.raycaster.setFromCamera(position, this.camera);
      const intersects = this.raycaster.intersectObjects([ this.galaxy ]);

      console.log('intersections ', intersects.length);

      for (let i = 0; i < intersects.length; i++) {
        console.log('is galaxy', intersects[i].object === this.galaxy);
        if (intersects[i].instanceId) {
          // this.galaxy.setColorAt(intersects[i].instanceId, new Three.Color(0xff0000));
          // this.galaxy.instanceColor.needsUpdate = true;
          console.log('current', this.controls.target);
          const distance = this.camera.position.distanceTo(this.controls.target);
          console.log('distance', distance);

          const from = {
            x: this.controls.target.x,
            y: this.controls.target.y,
            z: this.controls.target.z,
            d: distance,
          };

          const to = {
            x: this.vertices[intersects[i].instanceId][0],
            y: this.vertices[intersects[i].instanceId][1],
            z: this.vertices[intersects[i].instanceId][2],
            d: 100,
          };

          if (this.tween) {
            this.tween.stop();
          }

          this.tween = new TWEEN.Tween(from).
            to(to, 1000).
            easing(TWEEN.Easing.Quadratic.InOut).
            onUpdate(() => {
              this.controls.target.set(from.x, from.y, from.z);
              this.controls.minDistance = from.d;
              this.controls.maxDistance = from.d;
              this.controls.update();
              this.needsRender = true;
            }).
            onComplete(() => {
              this.controls.minDistance = 0;
              this.controls.maxDistance = Infinity;
              this.controls.update();
            }).
            start();
        }
      }
    },
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

      if (this.clouds.length) {
        for (const cloud of this.clouds) {
          this.scene.remove(cloud);
          cloud.geometry.dispose();
          cloud.material.dispose();
        }
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
          this.snackbar = true;
          return;
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

      this.geometry = new Three.IcosahedronGeometry(6, 3);
      this.material = new Three.MeshBasicMaterial();
      this.galaxy = new Three.InstancedMesh(this.geometry, this.material, this.systems.length);

      const matrix = new Three.Matrix4();
      for (let i = 0; i < this.systems.length; i++) {
        matrix.makeScale(...this.systems[i].sun.size);
        matrix.setPosition(...this.vertices[i]);
        this.galaxy.setMatrixAt(i, matrix);
        this.galaxy.setColorAt(i, this.systems[i].sun.color);
      }

      console.log('done. %dms', Date.now() - start);

      this.scene.add(this.galaxy);

      this.clouds = [];

      const geometry = new Three.CircleBufferGeometry(this.spiralDistance * 40);
      for (let p = 0; p < 4; p++) {
        const material = new Three.MeshStandardMaterial({
          map: this.texture,
          transparent: true,
          side: Three.DoubleSide,
          depthTest: false,
          color: new Three.Color(Math.random(), Math.random(), Math.random()),
        });

        const cloud = new Three.Mesh(geometry, material);
        cloud.position.set(0, 0, p);

        cloud.rotation.x = p / 360;
        cloud.rotation.y = p / 360;
        cloud.rotation.z = Math.random() * 360;

        cloud.material.opacity = random(15, 35) / 100;

        this.clouds.push(cloud);
        this.scene.add(cloud);
      }

      this.needsRender = true;
    },
    animate (time) {
      TWEEN.update(time);
      this.controls.update();

      if (this.needsRender) {
        // this.renderer.render(this.scene, this.camera);
        this.composer.render();
        this.needsRender = false;
      }

      requestAnimationFrame(this.animate);
    },
    asyncLoad (loader, resource) {
      return new Promise((resolve) => loader.load(resource, (asset) => {
        resolve(asset);
      }));
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
    regenerate () {
      this.loading = true;
      setTimeout(() => {
        this.generate();
        this.loading = false;
      }, 100);
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

      const spacer = Math.max(((dist * 8) / this.spiralDistance) * 5, 1) + 5;

      this.vertices.push([ x, y, z ].map(i => i * spacer));

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
