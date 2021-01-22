#!/usr/local/bin/node

////////////////////////////////////////////////////////////
// Gum 47

'use strict';

const fs = require('fs');
const assert = require('assert');
const PNG = require('pngjs').PNG;
const MongoClient = require('mongodb').MongoClient;

const PLANETARY_DISTANCE = 5;
const CLUSTER_STRENGTH = 0.85;
const SYSTEM_COUNT = 250000;
const BOUNDARY = 20000;
const BOUNDARY_ = -1 * BOUNDARY;

const SPIRAL = true;
const SPIRAL_COUNT = 4;
const SPIRAL_DISTANCE = 700;
const SPIRAL_COILS = 1.5;

const INITIAL_POS = 0;

const PADDING = 10;

function inCircle (centerX, centerY, radius, x, y) {
  const dist = Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2);
  return dist <= Math.pow(radius, 2);
}

function random (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

////////////////////////////////////////////////////////////
// Generators

let GLOBAL_ID_COUNT = 0;
function idGenerator () {
  return `00000000${ (GLOBAL_ID_COUNT++).toString(16) }`.slice(-8).replace(/(....)(....)/, '$1-$2');
}

const SYLLABLES = [ 'a', 'ab', 'ad', 'af', 'ag', 'ah', 'ak', 'al', 'am', 'an', 'ang', 'ap', 'ar', 'as', 'ash', 'at', 'ath', 'av', 'aw', 'ay', 'az', 'ba', 'be', 'bi', 'bla', 'ble', 'bli', 'blo', 'blu', 'bo', 'bra', 'bre', 'bri', 'bro', 'bru', 'bu', 'ce', 'cla', 'cle', 'cli', 'clo', 'clu', 'cra', 'cro', 'cru', 'da', 'de', 'di', 'do', 'dra', 'dre', 'dri', 'dro', 'dru', 'du', 'e', 'eb', 'ed', 'ef', 'eg', 'eh', 'ek', 'el', 'em', 'en', 'eng', 'ep', 'er', 'es', 'esh', 'et', 'eth', 'ev', 'ew', 'ey', 'ez', 'fa', 'fe', 'fi', 'fla', 'fle', 'fli', 'flo', 'flu', 'fo', 'fra', 'fre', 'fri', 'fro', 'fru', 'fu', 'ga', 'ge', 'gi', 'gla', 'gle', 'gli', 'glo', 'glu', 'go', 'gra', 'gre', 'gri', 'gro', 'gru', 'gu', 'ha', 'he', 'hi', 'ho', 'hu', 'i', 'ib', 'id', 'if', 'ig', 'ih', 'ik', 'il', 'im', 'in', 'ing', 'ip', 'ir', 'is', 'ish', 'it', 'ith', 'iv', 'iw', 'iy', 'iz', 'ka', 'ke', 'ki', 'kla', 'kle', 'kli', 'klo', 'klu', 'ko', 'kra', 'kre', 'kri', 'kro', 'kru', 'ku', 'la', 'le', 'li', 'lo', 'lu', 'ly', 'ma', 'me', 'mi', 'mo', 'mu', 'na', 'ne', 'ni', 'no', 'nu', 'o', 'ob', 'od', 'of', 'og', 'oh', 'ok', 'ol', 'om', 'on', 'ong', 'op', 'or', 'os', 'osh', 'ot', 'oth', 'ov', 'ow', 'oy', 'oz', 'pa', 'pe', 'pi', 'pla', 'ple', 'pli', 'plo', 'plu', 'po', 'pra', 'pre', 'pri', 'pro', 'pru', 'pu', 'ra', 're', 'ri', 'ro', 'ru', 'sa', 'se', 'sha', 'she', 'shi', 'sho', 'shu', 'si', 'sla', 'sle', 'sli', 'slo', 'slu', 'so', 'su', 'ta', 'te', 'tha', 'the', 'thi', 'tho', 'thra', 'thre', 'thri', 'thro', 'thru', 'thu', 'thy', 'ti', 'to', 'tra', 'tre', 'tri', 'tro', 'tru', 'tu', 'u', 'ub', 'ud', 'uf', 'ug', 'uh', 'uk', 'ul', 'um', 'un', 'ung', 'up', 'ur', 'us', 'ush', 'ut', 'uth', 'uv', 'uw', 'uy', 'uz', 'va', 've', 'vi', 'vla', 'vle', 'vli', 'vlo', 'vlu', 'vo', 'vra', 'vre', 'vri', 'vro', 'vru', 'vu', 'wa', 'we', 'wi', 'wo', 'wra', 'wre', 'wri', 'wro', 'wru', 'wu', 'ya', 'ye', 'yi', 'yl', 'yo', 'yth', 'yu', 'za', 'ze', 'zi', 'zla', 'zle', 'zli', 'zlo', 'zlu', 'zo', 'zra', 'zre', 'zri', 'zro', 'zru', 'zu' ];

const NAME_HASH = { };

function wordGenerator (length) {
  const syllableCount = length || random(2, 8);

  let word = '';
  for (let i = 0; i < syllableCount; i++) {
    word += SYLLABLES[random(0, SYLLABLES.length - 1)];
  }
  word = word.charAt(0).toUpperCase() + word.slice(1);

  return word;
}

function nameGenerator () {
  let clash = true;
  let name;

  while (clash) {
    name = wordGenerator(); // + ' ' + wordGenerator();

    clash = Boolean(NAME_HASH[name]);
  }

  NAME_HASH[name] = true;

  return name;
}

const STELLAR_TYPES = [
  {
    class: 'B',
    size: 'super giant',
    occurrence: 0.00001,
  },
  {
    class: 'A',
    size: 'super giant',
    occurrence: 0.00001,
  },
  {
    class: 'F',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    class: 'G',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    class: 'K',
    size: 'super giant',
    occurrence: 0.00002,
  },
  {
    class: 'M',
    size: 'super giant',
    occurrence: 0.00002,
  },

  {
    class: 'F',
    size: 'giant',
    occurrence: 0.0004,
  },
  {
    class: 'G',
    size: 'giant',
    occurrence: 0.0005,
  },
  {
    class: 'K',
    size: 'giant',
    occurrence: 0.0045,
  },
  {
    class: 'M',
    size: 'giant',
    occurrence: 0.00045,
  },
  {
    class: 'C',
    size: 'giant',
    occurrence: 0.001,
  },
  {
    class: 'S',
    size: 'giant',
    occurrence: 0.01,
  },

  {
    class: 'O',
    size: 'main sequence',
    occurrence: 0.0001,
  },
  {
    class: 'B',
    size: 'main sequence',
    occurrence: 0.0099,
  },
  {
    class: 'A',
    size: 'main sequence',
    occurrence: 0.02,
  },
  {
    class: 'F',
    size: 'main sequence',
    occurrence: 0.04,
  },
  {
    class: 'G',
    size: 'main sequence',
    occurrence: 0.08,
  },
  {
    class: 'K',
    size: 'main sequence',
    occurrence: 0.15,
  },
  {
    class: 'M',
    size: 'main sequence',
    occurrence: 0.60,
  },

  {
    class: 'B',
    size: 'white dwarf',
    occurrence: 0.01,
  },
  {
    class: 'A',
    size: 'white dwarf',
    occurrence: 0.02,
  },
  {
    class: 'F',
    size: 'white dwarf',
    occurrence: 0.02,
  },
  {
    class: 'G',
    size: 'white dwarf',
    occurrence: 0.01,
  },
  {
    class: 'K',
    size: 'white dwarf',
    occurrence: 0.0095,
  },

  {
    class: 'L',
    size: 'dwarf',
    occurrence: 0.001,
  },
  {
    class: 'T',
    size: 'dwarf',
    occurrence: 0.001,
  },

  {
    class: 'P',
    size: 'nebula',
    occurrence: 0.01,
  },

  {
    class: 'NS',
    size: 'neutron star',
    occurrence: 0.00045,
  },
  {
    class: 'BH',
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
  'L': [ 141, 20, 0 ],
  'T': [ 81, 0, 26 ],
  'D': [ 130, 139, 164 ],
  'P': [ 0, 255, 236 ],
  'NS': [ 255, 255, 255 ],
  'BH': [ 0, 0, 0 ],
};

function stellarGenerator () {
  const accuracy = 10000000;
  const type = random(0, accuracy);
  let index = STELLAR_TYPES.length - 1;

  for (let i = 0, perc = 0; i < STELLAR_TYPES.length; i++) {
    perc += Math.ceil(accuracy * STELLAR_TYPES[i].occurrence);
    if (type < perc) {
      index = i;
      break;
    }
  }

  const stellarClass = STELLAR_TYPES[index].class;

  const sun = {
    class: stellarClass,
    size: STELLAR_TYPES[index].size,
    color: STELLAR_COLORS[stellarClass],
  };
  return sun;
}

const PLANET_NUMERALS = [ 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X' ];

function planetGenerator (system, index) {
  const planet = {
    id: idGenerator(),
    name: `${ system.name } ${ PLANET_NUMERALS[index] }`,
  };

  return planet;
}

function systemGenerator (x, y) {
  const system = {
    id: idGenerator(),
    name: nameGenerator(),
    sun: stellarGenerator(),
    planets: [],
    x,
    y,
  };
  /*
    var planetCount = random(1, 10);
    for (var i = 0; i < planetCount; i++) {
    system.planets.push(planetGenerator(system, i));
    }
  */
  return system;
}

////////////////////////////////////////////////////////////

function Galaxy () {
  const self = this;

  self.systems = [];
  self.positions = {};

  function setPosition (x, y, system) {
    self.positions[`${ x },${ y }`] = system;
  }

  function getPosition (x, y) {
    return self.positions[`${ x },${ y }`];
  }

  function safePosition (x, y) {
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

  function createSystem (position) {
    const newSystem = systemGenerator(position.x, position.y);
    setPosition(position.x, position.y, newSystem);
    self.systems.push(newSystem);

    self.minX = Math.min(self.minX, position.x);
    self.minY = Math.min(self.minY, position.y);
    self.maxX = Math.max(self.maxX, position.x);
    self.maxY = Math.max(self.maxY, position.y);

    return newSystem;
  }

  function spiralGenerator (centerX, centerY, radius, coils, rotation) {
    const thetaMax = coils * 2 * Math.PI;

    const awayStep = radius / thetaMax;

    const chord = 10;

    for ( let theta = chord / awayStep; theta <= thetaMax; ) {
      const away = awayStep * theta;
      const around = theta + rotation;
      const x = Math.round(centerX + Math.cos( around ) * away);
      const y = Math.round(centerY + Math.sin( around ) * away);

      if (safePosition(x, y) && !getPosition(x, y)) {
        createSystem({
          x,
          y,
        });
      }

      const delta = ( -2 * away + Math.sqrt( 4 * away * away + 8 * awayStep * chord ) ) /
          ( 2 * awayStep );
      theta += delta;
    }
  }

  const initialX = INITIAL_POS;
  const initialY = INITIAL_POS;
  const initial = systemGenerator(initialX, initialY);

  const printPercentages = [ 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ];

  self.systems.push(initial);
  setPosition(initialX, initialY, initial);

  self.minX = 0;
  self.minY = 0;
  self.maxX = 0;
  self.maxY = 0;

  const clusterCount = Math.floor(Math.pow(PLANETARY_DISTANCE * 2 + 1, 2) * CLUSTER_STRENGTH);

  console.log('Generating galaxy:');

  if (SPIRAL) {
    for (let i = 0; i < SPIRAL_COUNT; i++) {
      spiralGenerator(initialX, initialY,
        SPIRAL_DISTANCE,
        SPIRAL_COILS,
        360 * i);
    }
  }

  const possibilities = self.systems.slice(0);

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
        if (safePosition(x, y) && !getPosition(x, y) &&
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

      const newSystem = createSystem(position);
      possibilities.push(newSystem);

      if (i % 100 === 0) {
        process.stdout.write('\u001b[38;5;33m.\u001b[0m');
      }

      for (let p = 0; p < printPercentages.length; p++) {
        if (i === Math.floor((SYSTEM_COUNT - 1) * printPercentages[p])) {
          process.stdout.write(`${ Math.round(printPercentages[p] * 100) }%`);
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

const galaxy = new Galaxy();
const width = Math.abs(galaxy.maxX - galaxy.minX);
const height = Math.abs(galaxy.maxY - galaxy.minY);
const data = new Buffer(width * height * 4);
let drawCount = 0;

console.log('%s, %s to %s, %s (%sx%s)', galaxy.minY, galaxy.minX, galaxy.maxX, galaxy.maxY, width, height);

let offset = 0;
for (let y = galaxy.minY; y < galaxy.maxY; y++) {
  for (let x = galaxy.minX; x < galaxy.maxX; x++) {
    const system = galaxy.positions[`${ x },${ y }`];
    if (system) {
      data[offset] = system.sun.color[0];
      data[offset + 1] = system.sun.color[1];
      data[offset + 2] = system.sun.color[2];
      data[offset + 3] = 255;
      drawCount++;
    } else {
      data[offset] = 5;
      data[offset + 1] = 5;
      data[offset + 2] = 20;
      data[offset + 3] = 255;
    }
    offset += 4;
  }
}

const png = new PNG();
png.width = width;
png.height = height;
png.data = data;

png.pack().pipe(fs.createWriteStream('galaxy.png'));

console.log('%s systems generated.', drawCount);

/*
console.log('Populating database...');

MongoClient.connect('mongodb://localhost:27017/gum47', { wtimeout: 60000 }, function(err, db) {
  assert.equal(null, err);
  var collection = db.collection('systems');
  collection.drop();

  collection.insertMany(galaxy.systems, function(err, result) {
    assert.equal(null, err);
    console.log('Database updated.');
    db.close();
  });
});
*/
