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

    this.camera = new Three.PerspectiveCamera(60, this.canvasWidth / this.canvasHeight, 0.001, 10000);
    this.camera.position.set(0, 20, 100);

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
      console.log('generating...');
    },
    animate () {
      this.controls.update();

      if (this.needsRender) {
        this.renderer.render(this.scene, this.camera);
        this.needsRender = false;
      }

      requestAnimationFrame(this.animate);
    },
  },
};
</script>
