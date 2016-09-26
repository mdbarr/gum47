#!/usr/bin/node --max-old-space-size=1024

////////////////////////////////////////////////////////////
// Gum 47

'use strict'

var _ = require('underscore');
var fs = require('fs');
var PNG = require('pngjs').PNG;

var PLANETARY_DISTANCE = 4;
var CLUSTER_STRENGTH = 0.85;
var SYSTEM_COUNT = 250000;
var BOUNDARY = 20000;
var BOUNDARY_ = -1 * BOUNDARY;

var SPIRAL = true;
var SPIRAL_COUNT = 12;
var SPIRAL_DISTANCE = 750;
var SPIRAL_COILS = 1.5;

var INITIAL_POS = 0;

var PADDING = 10;

function inCircle(center_x, center_y, radius, x, y) {
  var dist = Math.pow(center_x - x, 2) + Math.pow(center_y - y, 2);
  return dist <= Math.pow(radius, 2);
}

////////////////////////////////////////////////////////////
// Generators

var GLOBAL_ID_COUNT = 0;
function idGenerator() {
  return ('00000000' + (GLOBAL_ID_COUNT++).toString(16)).slice(-8).replace(/(....)(....)/, '$1-$2');
}

var SYLLABLES = ["a", "ab", "ad", "af", "ag", "ah", "ak", "al", "am", "an", "ang", "ap", "ar", "as", "ash", "at", "ath", "av", "aw", "ay", "az", "ba", "be", "bi", "bla", "ble", "bli", "blo", "blu", "bo", "bra", "bre", "bri", "bro", "bru", "bu", "ce", "cla", "cle", "cli", "clo", "clu", "cra", "cro", "cru", "da", "de", "di", "do", "dra", "dre", "dri", "dro", "dru", "du", "e", "eb", "ed", "ef", "eg", "eh", "ek", "el", "em", "en", "eng", "ep", "er", "es", "esh", "et", "eth", "ev", "ew", "ey", "ez", "fa", "fe", "fi", "fla", "fle", "fli", "flo", "flu", "fo", "fra", "fre", "fri", "fro", "fru", "fu", "ga", "ge", "gi", "gla", "gle", "gli", "glo", "glu", "go", "gra", "gre", "gri", "gro", "gru", "gu", "ha", "he", "hi", "ho", "hu", "i", "ib", "id", "if", "ig", "ih", "ik", "il", "im", "in", "ing", "ip", "ir", "is", "ish", "it", "ith", "iv", "iw", "iy", "iz", "ka", "ke", "ki", "kla", "kle", "kli", "klo", "klu", "ko", "kra", "kre", "kri", "kro", "kru", "ku", "la", "le", "li", "lo", "lu", "ly", "ma", "me", "mi", "mo", "mu", "na", "ne", "ni", "no", "nu", "o", "ob", "od", "of", "og", "oh", "ok", "ol", "om", "on", "ong", "op", "or", "os", "osh", "ot", "oth", "ov", "ow", "oy", "oz", "pa", "pe", "pi", "pla", "ple", "pli", "plo", "plu", "po", "pra", "pre", "pri", "pro", "pru", "pu", "ra", "re", "ri", "ro", "ru", "sa", "se", "sha", "she", "shi", "sho", "shu", "si", "sla", "sle", "sli", "slo", "slu", "so", "su", "ta", "te", "tha", "the", "thi", "tho", "thra", "thre", "thri", "thro", "thru", "thu", "thy", "ti", "to", "tra", "tre", "tri", "tro", "tru", "tu", "u", "ub", "ud", "uf", "ug", "uh", "uk", "ul", "um", "un", "ung", "up", "ur", "us", "ush", "ut", "uth", "uv", "uw", "uy", "uz", "va", "ve", "vi", "vla", "vle", "vli", "vlo", "vlu", "vo", "vra", "vre", "vri", "vro", "vru", "vu", "wa", "we", "wi", "wo", "wra", "wre", "wri", "wro", "wru", "wu", "ya", "ye", "yi", "yl", "yo", "yth", "yu", "za", "ze", "zi", "zla", "zle", "zli", "zlo", "zlu", "zo", "zra", "zre", "zri", "zro", "zru", "zu"];

var NAME_HASH = { };

function wordGenerator(length) {
  var syllableCount = length || _.random(2, 8);

  var word = '';
  for (var i = 0; i < syllableCount; i++) {
    word += SYLLABLES[_.random(0, SYLLABLES.length - 1)];
  }
  word = word.charAt(0).toUpperCase() + word.slice(1);

  return word;
}

function nameGenerator() {
  var clash = true;
  var name;


  while (clash)  {

    name = wordGenerator(); //+ ' ' + wordGenerator();

    clash = (NAME_HASH[name]) ? true : false;
  }

  NAME_HASH[name] = true;

  return name;
}

var STELLAR_TYPES = [
  { class: 'B', size: 'super giant', occurrence: 0.00001 },
  { class: 'A', size: 'super giant', occurrence: 0.00001 },
  { class: 'F', size: 'super giant', occurrence: 0.00002 },
  { class: 'G', size: 'super giant', occurrence: 0.00002 },
  { class: 'K', size: 'super giant', occurrence: 0.00002 },
  { class: 'M', size: 'super giant', occurrence: 0.00002 },

  { class: 'F', size: 'giant', occurrence: 0.0004 },
  { class: 'G', size: 'giant', occurrence: 0.0005 },
  { class: 'K', size: 'giant', occurrence: 0.0045 },
  { class: 'M', size: 'giant', occurrence: 0.00045 },
  { class: 'C', size: 'giant', occurrence: 0.001 },
  { class: 'S', size: 'giant', occurrence: 0.01 },

  { class: 'O', size: 'main sequence', occurrence: 0.0001 },
  { class: 'B', size: 'main sequence', occurrence: 0.0099 },
  { class: 'A', size: 'main sequence', occurrence: 0.02 },
  { class: 'F', size: 'main sequence', occurrence: 0.04 },
  { class: 'G', size: 'main sequence', occurrence: 0.08 },
  { class: 'K', size: 'main sequence', occurrence: 0.15 },
  { class: 'M', size: 'main sequence', occurrence: 0.60 },

  { class: 'B', size: 'white dwarf', occurrence: 0.01 },
  { class: 'A', size: 'white dwarf', occurrence: 0.02 },
  { class: 'F', size: 'white dwarf', occurrence: 0.02 },
  { class: 'G', size: 'white dwarf', occurrence: 0.01 },
  { class: 'K', size: 'white dwarf', occurrence: 0.0095 },

  { class: 'L', size: 'dwarf', occurrence: 0.001 },
  { class: 'T', size: 'dwarf', occurrence: 0.001 },

  { class: 'P', size: 'nebula', occurrence: 0.01 },

  { class: 'NS', size: 'neutron star', occurrence: 0.00045 },
  { class: 'BH', size: 'black hole', occurrence: 0.00005 }

];

/*
var sum = 0;
for (var i = 0; i < STELLAR_TYPES.length; i++) {
  sum += STELLAR_TYPES[i].occurrence;
}
console.log('OCCURRENCE SUM', sum);
*/

var STELLAR_COLORS = {
  'W': [ 170, 191, 255 ],
  'O': [ 157, 180, 255 ],
  'B': [ 170, 191, 255 ],
  'A': [ 202, 216, 255 ],
  'F': [ 251, 248, 255 ],
  'G': [ 255, 244, 232 ],
  'K': [ 255, 221, 190 ],
  'M': [ 255, 187, 123 ],
  'C': [ 255, 83, 0 ],
  'S': [ 255, 147, 4 ],
  'L': [ 141, 20,0 ],
  'T': [ 81, 0, 26 ],
  'D': [ 130, 139, 164 ],
  'P': [ 0, 255, 236 ],
  'NS': [ 255, 255, 255 ],
  'BH': [ 0, 0, 0 ]
};

function stellarGenerator() {
  var accuracy = 10000000;
  var type = _.random(0, accuracy);
  var index = STELLAR_TYPES.length - 1;

  for (var i = 0, perc = 0; i < STELLAR_TYPES.length; i++) {
    perc += Math.ceil(accuracy * STELLAR_TYPES[i].occurrence);
    if (type < perc) {
      index = i;
      break;
    }
  }

  var stellarClass = STELLAR_TYPES[index].class;

  var sun = {
    class: stellarClass,
    size: STELLAR_TYPES[index].size,
    color: STELLAR_COLORS[stellarClass]
  };
  return sun;
}

var PLANET_NUMERALS = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X' ];

function planetGenerator(system, index) {
  var planet = {
    id: idGenerator(),
    name: system.name + ' ' + PLANET_NUMERALS[index]
  };

  return planet;
}

function systemGenerator(x, y) {
  var system = {
    id: idGenerator(),
    name: nameGenerator(),
    sun: stellarGenerator(),
    planets: [],
    position: {
      x: x,
      y: y
    }
  };
  /*
    var planetCount = _.random(1, 10);
    for (var i = 0; i < planetCount; i++) {
    system.planets.push(planetGenerator(system, i));
    }
  */
  return system;
}

////////////////////////////////////////////////////////////

function Galaxy() {
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
  }

  function createSystem(position) {
    var newSystem = systemGenerator(position.x, position.y);
    setPosition(position.x, position.y, newSystem);
    self.systems.push(newSystem);

    self.minX = Math.min(self.minX, position.x);
    self.minY = Math.min(self.minY, position.y);
    self.maxX = Math.max(self.maxX, position.x);
    self.maxY = Math.max(self.maxY, position.y);

    return newSystem
  }

  function spiralGenerator(centerX, centerY, radius, coils, rotation) {
    var thetaMax = coils * 2 * Math.PI;

    var awayStep = radius / thetaMax;

    var chord = 10;

    for ( var theta = chord / awayStep; theta <= thetaMax; ) {
      var away = awayStep * theta;
      var around = theta + rotation;
      var x = Math.round(centerX + Math.cos ( around ) * away);
      var y = Math.round(centerY + Math.sin ( around ) * away);

      var position = { x: x, y: y };

      createSystem(position);

      var delta = ( -2 * away + Math.sqrt ( 4 * away * away + 8 * awayStep * chord ) ) /
          ( 2 * awayStep );
      theta += delta;
    }
  }

  var initialX = INITIAL_POS;
  var initialY = INITIAL_POS;
  var initial = systemGenerator(initialX, initialY);

  var printPercentages = [ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ];

  self.systems.push(initial);
  setPosition(initialX, initialY, initial);

  self.minX = 0;
  self.minY = 0;
  self.maxX = 0;
  self.maxY = 0;

  var clusterCount = Math.floor(Math.pow((PLANETARY_DISTANCE * 2) + 1, 2) * CLUSTER_STRENGTH);

  console.log('Generating galaxy:');

  if (SPIRAL) {
    for (var i = 0; i < SPIRAL_COUNT; i++) {
      spiralGenerator(initialX, initialY,
                      SPIRAL_DISTANCE,
                      SPIRAL_COILS,
                      360 * i);
    }
  }

  var possibilities = self.systems.slice(0);

  for (var i = possibilities.length; i < SYSTEM_COUNT; i++) {
    var distace = _.random(1, PLANETARY_DISTANCE);
    var index = _.random(0, possibilities.length - 1);
    var neighbor = possibilities[index];

    if (!neighbor) {
      console.log('FAULT', index, possibilities.length);
      i--;
      possibilities.splice(index, 1);
      continue;
    }

    var candidates = [];

    var cornerX = neighbor.position.x - PLANETARY_DISTANCE;
    var cornerY = neighbor.position.y - PLANETARY_DISTANCE;
    var dist = PLANETARY_DISTANCE * 2;

    for (var x = cornerX; x <= (cornerX + dist); x++) {
      for (var y = cornerY; y <= (cornerY + dist); y++) {
        if (safePosition(x,y) && !getPosition(x, y) &&
            !inCircle(neighbor.position.x, neighbor.position.y, 1.2, x, y)) {
          candidates.push({ x: x, y: y });
        }
      }
    }

    if (candidates.length < clusterCount) {
      i--;
      possibilities.splice(index, 1);
      continue;
    } else {
      var position = candidates[_.random(0, candidates.length - 1)];

      var newSystem = createSystem(position);
      possibilities.push(newSystem);

      if (i % 100 === 0) {
        process.stdout.write('\u001b[38;5;33m.\u001b[0m');
      }

      for (var p = 0; p < printPercentages.length; p++) {
        if (i === Math.floor((SYSTEM_COUNT - 1) * printPercentages[p])) {
          process.stdout.write(Math.round(printPercentages[p] * 100) + '%');
          break;
        }
      }
    }
  }
  process.stdout.write('\n');

  self.minX -= PADDING;
  self.maxX += PADDING;
  self.minY -= PADDING;
  self.maxY += PADDING;
}

////////////////////////////////////////////////////////////

var galaxy = new Galaxy();
var width = Math.abs(galaxy.maxX - galaxy.minX);
var height = Math.abs(galaxy.maxY - galaxy.minY);
var data = new Buffer(width * height * 4);

console.log("%s, %s to %s, %s (%sx%s)", galaxy.minY, galaxy.minX, galaxy.maxX, galaxy.maxY, width, height);

var offset = 0;
for (var y = galaxy.minY; y < galaxy.maxY; y++) {

  for (var x = galaxy.minX; x < galaxy.maxX; x++) {
    var system = galaxy.positions[x + ',' + y];
    if (system) {
      data[offset] = system.sun.color[0];
      data[offset+1] = system.sun.color[1];
      data[offset+2] = system.sun.color[2];
      data[offset+3] = 255;
    } else {
      data[offset] = 5;
      data[offset+1] = 5;
      data[offset+2] = 20;
      data[offset+3] = 255;
    }
    offset += 4;
  }
}

var png = new PNG();
png.width = width;
png.height = height;
png.data = data

png.pack().pipe(fs.createWriteStream('galaxy.png'));

console.log('%s systems generated.', galaxy.systems.length);
