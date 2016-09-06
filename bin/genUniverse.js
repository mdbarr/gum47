#!/usr/bin/env node

////////////////////////////////////////////////////////////
// Gum 47

'use strict'

var _ = require('underscore');
var fs = require('fs');
var PNG = require('pngjs').PNG;

var PLANETARY_DISTANCE = 4;
var CLUSTER_STRENGTH = 0.9;
var SYSTEM_COUNT = 1000000;
var BOUNDARY = 10000;
var BOUNDARY_ = -1 * BOUNDARY;

var BLACKHOLE_RADIUS = 35;

var INITIAL_POS = 800; //Math.max(SYSTEM_COUNT * 0.001, 40);

////////////////////////////////////////////////////////////
// Generators
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(d) {
  for (var c = d.length - 1; c > 0; c--) {
    var b = Math.floor(Math.random() * (c + 1));
    var a = d[c];
    d[c] = d[b];
    d[b] = a;
  }
  return d
}

function inCircle(center_x, center_y, radius, x, y) {
  var dist = Math.pow(center_x - x, 2) + Math.pow(center_y - y, 2);
  return dist <= Math.pow(radius, 2);
}

function generateName(length) {
  length = length || 8;
  var lowercase = 'abcdefghijklmnopqrstuvwxyz';
  var name = '';
  for (var i = 0; i < length; i++) {
    name += lowercase.charAt(random(0, lowercase.length));
    if (i === 0) {
      name = name.toUpperCase();
    }
  }
  return name;
}

var STELLAR_TYPES = [ { class: 'O', color: [ 50, 50, 255 ], size: 'giant', occurrence: 0.0000003 },
                      { class: 'B', color: [ 100, 100, 255 ], size: 'giant', occurrence: 0.00125 },
                      { class: 'A', color: [ 151, 200, 232 ], size: 'normal', occurrence: 0.00625},
                      { class: 'F', color: [ 255, 255, 255 ], size: 'normal', occurrence: 0.0303 },
                      { class: 'G', color: [ 200, 200, 0 ], size: 'normal', occurrence: 0.075 },
                      { class: 'K', color: [ 255, 127, 0 ], size: 'normal', occurrence: 0.12, },
                      { class: 'M', color: [ 200, 0, 0 ], size: 'giant', occurrence: 0.76 } ];

function stellarGenerator() {
  var accuracy = 10000000;
  var type = random(0, accuracy);
  var index = STELLAR_TYPES.length - 1;

  for (var i = 0, perc = 0; i < STELLAR_TYPES.length; i++) {
    perc += Math.ceil(accuracy * STELLAR_TYPES[i].occurrence);
    if (type < perc) {
      index = i;
      break;
    }
  }

  var sun = _.clone(STELLAR_TYPES[index]);
  return sun;
}

function planetGenerator(system, index) {
  var planet = {
    name: system.name + ' ' + (index + 1)
  };
  return planet;
}

function systemGenerator(x, y) {
  var system = {
    name: generateName(),
    sun: stellarGenerator(),
    planets: [],
    position: {
      x: x,
      y: y
    }
  };

  var planetCount = random(1, 10);
  for (var i = 0; i < planetCount; i++) {
    system.planets.push(planetGenerator(system, i));
  }
  return system;
}

////////////////////////////////////////////////////////////

function Universe() {
  var self = this;

  self.systems = [];
  self.positions = {};

  function setPosition(x, y, system) {
    self.positions[x + ',' + y] = system;
  }

  function getPosition(x, y) {
    return self.positions[x + ',' + y];
  }

  function safePosition(x, y) {
    if (x > BOUNDARY || x < BOUNDARY_) {
      return false;
    }

    if (y > BOUNDARY || y < BOUNDARY_) {
      return false;
    }

    if (Math.abs(x) < BLACKHOLE_RADIUS && Math.abs(y) < BLACKHOLE_RADIUS &&
        inCircle(0, 0, BLACKHOLE_RADIUS, x, y)) {
      return false;
    }
    /*
    if ((x > -50 && x < 50) && (y > -50 && y < 50)) {
      return false;
    }
    */
    return true;
  }

  var initialX = INITIAL_POS;//random(BOUNDARY_, BOUNDARY);
  var initialY = INITIAL_POS;//random(BOUNDARY_, BOUNDARY);
  var initial = systemGenerator(initialX, initialY);

  var printPercentages = [ 0.25, 0.5, 0.75, 1 ];

  console.log(initialX, initialY);

  self.systems.push(initial);
  setPosition(initialX, initialY, initial);

  self.minX = 0;
  self.minY = 0;
  self.maxX = 0;
  self.maxY = 0;

  var clusterCount = Math.floor(Math.pow(PLANETARY_DISTANCE * 2, 2) * CLUSTER_STRENGTH);

  process.stdout.write('\nGenerating universe');

  var possibilities = self.systems.slice(0);

  for (var i = 0; i < SYSTEM_COUNT; i++) {
    var distace = random(1, PLANETARY_DISTANCE);
    var index = random(0, possibilities.length - 1);
    var neighbor = possibilities[index];

    if (!neighbor) {
      console.log('FAULT', index, possibilities.length);
    }

    var candidates = [];

    var cornerX = neighbor.position.x - PLANETARY_DISTANCE;
    var cornerY = neighbor.position.y - PLANETARY_DISTANCE;
    var dist = PLANETARY_DISTANCE * 2;

    for (var x = cornerX; x < (cornerX + dist); x++) {
      for (var y = cornerY; y < (cornerY + dist); y++) {
        if (safePosition(x,y) && !getPosition(x, y)) {
          candidates.push({
            x: x,
            y: y
          })
        }

      }
    }
    //console.log(candidates);

    //candidates = candidates.sort();
    //candidates = shuffleArray(candidates);

    if (candidates.length < clusterCount) {
      i--;
      possibilities.splice(index, 1);
    } else {
      var position = candidates[random(0, candidates.length - 1)];
      var newSystem = systemGenerator(position.x, position.y);
      setPosition(position.x, position.y, newSystem);
      self.systems.push(newSystem);

      possibilities.push(newSystem);

      //console.log(newSystem);

      self.minX = Math.min(self.minX, position.x);
      self.minY = Math.min(self.minY, position.y);
      self.maxX = Math.max(self.maxX, position.x);
      self.maxY = Math.max(self.maxY, position.y);

      if (i % 100 === 0) {
        process.stdout.write('\u001b[36m.\u001b[0m');
      }

      for (var p = 0; p < printPercentages.length; p++) {
        if (i === Math.floor((SYSTEM_COUNT - 1) * printPercentages[p])) {
          process.stdout.write((printPercentages[p] * 100) + '%');
          break;
        }
      }
    }

  }
  process.stdout.write('\n');
}

////////////////////////////////////////////////////////////

var universe = new Universe();
var width = Math.abs(universe.maxX - universe.minX);
var height = Math.abs(universe.maxY - universe.minY);
var data = new Buffer(width * height * 4);

console.log("%s, %s to %s, %s (%sx%s)", universe.minY, universe.minX, universe.maxX, universe.maxY, width, height);

var offset = 0;
for (var y = universe.minY; y < universe.maxY; y++) {

  for (var x = universe.minX; x < universe.maxX; x++) {
    var system = universe.positions[x + ',' + y];
    if (system) {
      //process.stdout.write('#');

      data[offset] = system.sun.color[0];
      data[offset+1] = system.sun.color[1];
      data[offset+2] = system.sun.color[2];
      data[offset+3] = 255;
    } else {
      //process.stdout.write(' ');

      data[offset] = 0;
      data[offset+1] = 0;
      data[offset+2] = 0;
      data[offset+3] = 255;
    }
    offset += 4;
  }
  //process.stdout.write('\n');
}

var png = new PNG();
png.width = width;
png.height = height;
png.data = data

png.pack().pipe(fs.createWriteStream('universe.png'));
