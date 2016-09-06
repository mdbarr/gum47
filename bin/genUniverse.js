#!/usr/bin/env node

////////////////////////////////////////////////////////////
// Gum 47

'use strict'

var fs = require('fs');
var PNG = require('pngjs').PNG;

var PLANETARY_DISTANCE = 4;
var CLUSTER_STRENGTH = 0.9;
var SYSTEM_COUNT = 100000;
var BOUNDARY = 800;
var BOUNDARY_ = -1 * BOUNDARY;

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
  var dist = Math.sqrt(Math.pow(center_x - x, 2) + Math.pow(center_y - y, 2));
  return dist <= radius
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


function stellarGenerator() {
  var sun = {
    class: 0
  };
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

    if (inCircle(0, 0, 25, x, y)) {
      return false;
    }
    /*
    if ((x > -50 && x < 50) && (y > -50 && y < 50)) {
      return false;
    }
    */
    return true;
  }

  var initialX = 250;//random(BOUNDARY_, BOUNDARY);
  var initialY = 250;//random(BOUNDARY_, BOUNDARY);
  var initial = systemGenerator(initialX, initialY);

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

    for (var x = cornerX; x < cornerX + dist; x++) {
      for (var y = cornerY; y < cornerY + dist; y++) {
        if (safePosition(x,y) && !getPosition(x, y)) {
          candidates.push({
            x: x,
            y: y
          })
        }

      }
    }
    //console.log(candidates);

    candidates = candidates.sort(); //shuffleArray(candidates);

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

    if (universe.positions[x + ',' + y]) {
      //process.stdout.write('#');

      data[offset] = 255;
      data[offset+1] = 255;
      data[offset+2] = 255;
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
