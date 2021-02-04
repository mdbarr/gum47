const THREE = require('three');

THREE.Line2 = require('three/examples/jsm/lines/Line2').Line2;
THREE.LineGeometry = require('three/examples/jsm/lines/LineGeometry').LineGeometry;
THREE.LineMaterial = require('three/examples/jsm/lines/LineMaterial').LineMaterial;
THREE.OrbitControls = require('three/examples/jsm/controls/OrbitControls').OrbitControls;
THREE.STLLoader = require('three/examples/jsm/loaders/STLLoader').STLLoader;

THREE.EffectComposer = require('three/examples/jsm/postprocessing/EffectComposer').EffectComposer;
THREE.RenderPass = require('three/examples/jsm/postprocessing/RenderPass').RenderPass;
THREE.UnrealBloomPass = require('three/examples/jsm/postprocessing/UnrealBloomPass').UnrealBloomPass;

// TextGeometry
function TextShapeGeometry (text, parameters) {
  THREE.Geometry.call(this);

  this.type = 'TextShapeGeometry';

  this.parameters = {
    text,
    parameters,
  };

  this.fromBufferGeometry(new TextShapeBufferGeometry(text, parameters));
  this.mergeVertices();
}

TextShapeGeometry.prototype = Object.create(THREE.Geometry.prototype);
TextShapeGeometry.prototype.constructor = TextShapeGeometry;

// TextShapeBufferGeometry
function TextShapeBufferGeometry (text, parameters) {
  parameters = parameters || {};

  const font = parameters.font;

  if (!(font && font.isFont)) {
    console.error('THREE.TextShapeGeometry: font parameter is not an instance of THREE.Font.');
    return new THREE.Geometry();
  }

  const shapes = font.generateShapes(text, parameters.size);

  THREE.ShapeBufferGeometry.call(this, shapes);

  this.type = 'TextShapeBufferGeometry';
}

TextShapeBufferGeometry.prototype = Object.create(THREE.ShapeBufferGeometry.prototype);
TextShapeBufferGeometry.prototype.constructor = TextShapeBufferGeometry;

THREE.TextShapeGeometry = TextShapeGeometry;
THREE.TextShapeBufferGeometry = TextShapeBufferGeometry;

module.exports = THREE;
