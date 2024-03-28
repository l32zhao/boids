// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;
let wind = { x: 0, y: 0 }; // Wind velocity vector
// let wind = { x: 0.5, y: 0.3 }; // Wind velocity vector

// Call createNewGeneration periodically (e.g., every 100 frames)
let frameCount = 0;

const numBoids = 100;
const visualRange = 75;

var boids = [];

function initBoids() {
  for (var i = 0; i < numBoids; i += 1) {
    boids[boids.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      history: [],
      cohesionDistance: Math.random() * 100 + 50, // Random cohesion distance between 50 and 150
    };
  }
  initCohesionDistances();
}

function distance(boid1, boid2) {
  return Math.sqrt(
    (boid1.x - boid2.x) * (boid1.x - boid2.x) +
      (boid1.y - boid2.y) * (boid1.y - boid2.y),
  );
}

// TODO: This is naive and inefficient.
function nClosestBoids(boid, n) {
  // Make a copy
  const sorted = boids.slice();
  // Sort the copy by distance from `boid`
  sorted.sort((a, b) => distance(boid, a) - distance(boid, b));
  // Return the `n` closest
  return sorted.slice(1, n + 1);
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("boids");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

// Constrain a boid to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(boid) {
  const margin = 200;
  const turnFactor = 1;

  if (boid.x < margin) {
    boid.dx += turnFactor;
  }
  if (boid.x > width - margin) {
    boid.dx -= turnFactor
  }
  if (boid.y < margin) {
    boid.dy += turnFactor;
  }
  if (boid.y > height - margin) {
    boid.dy -= turnFactor;
  }
}

// Find the center of mass of the other boids and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(boid) {
  const centeringFactor = 0.005; // adjust velocity by this %

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < boid.cohesionDistance) {
      centerX += otherBoid.x;
      centerY += otherBoid.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    boid.dx += (centerX - boid.x) * centeringFactor;
    boid.dy += (centerY - boid.y) * centeringFactor;
  }
}

// Move away from other boids that are too close to avoid colliding
function avoidOthers(boid) {
  const minDistance = 20; // The distance to stay away from other boids
  const avoidFactor = 0.05; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  for (let otherBoid of boids) {
    if (otherBoid !== boid) {
      if (distance(boid, otherBoid) < minDistance) {
        moveX += boid.x - otherBoid.x;
        moveY += boid.y - otherBoid.y;
      }
    }
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

// Find the average velocity (speed and direction) of the other boids and
// adjust velocity slightly to match.
function matchVelocity(boid) {
  const matchingFactor = 0.05; // Adjust by this % of average velocity

  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherBoid of boids) {
    if (distance(boid, otherBoid) < boid.cohesionDistance) {
      avgDX += otherBoid.dx;
      avgDY += otherBoid.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    boid.dx += (avgDX - boid.dx) * matchingFactor;
    boid.dy += (avgDY - boid.dy) * matchingFactor;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
function limitSpeed(boid) {
  const speedLimit = 15;

  const speed = Math.sqrt(boid.dx * boid.dx + boid.dy * boid.dy);
  if (speed > speedLimit) {
    boid.dx = (boid.dx / speed) * speedLimit;
    boid.dy = (boid.dy / speed) * speedLimit;
  }
}

const DRAW_TRAIL = false;

function drawBoid(ctx, boid) {
  const angle = Math.atan2(boid.dy, boid.dx);
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.translate(-boid.x, -boid.y);
  ctx.fillStyle = "#558cf4";
  ctx.beginPath();
  ctx.moveTo(boid.x, boid.y);
  ctx.lineTo(boid.x - 15, boid.y + 5);
  ctx.lineTo(boid.x - 15, boid.y - 5);
  ctx.lineTo(boid.x, boid.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // if (DRAW_TRAIL) {
  //   ctx.strokeStyle = "#558cf466";
  //   ctx.beginPath();
  //   ctx.moveTo(boid.history[0][0], boid.history[0][1]);
  //   for (const point of boid.history) {
  //     ctx.lineTo(point[0], point[1]);
  //   }
  //   ctx.stroke();
  // }
}

// Apply wind force to each boid's velocity
function applyWindForce(boid) {
  boid.dx += wind.x;
  boid.dy += wind.y;
}

// Main animation loop
function animationLoop() {
  // Calculate the center of mass
  let centerX = 0;
  let centerY = 0;

  // Update each boid
  for (let boid of boids) {
    // Update the velocities according to each rule
    flyTowardsCenter(boid);
    avoidOthers(boid);
    matchVelocity(boid);
    limitSpeed(boid);
    keepWithinBounds(boid);

    // Apply wind force
    applyWindForce(boid);

    // Update the position based on the current velocity
    boid.x += boid.dx;
    boid.y += boid.dy;
    // boid.history.push([boid.x, boid.y]);
    // boid.history = boid.history.slice(-50);

    centerX += boid.x;
    centerY += boid.y;
  }

  // Clear the canvas and redraw all the boids in their current positions
  const ctx = document.getElementById("boids").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let boid of boids) {
    drawBoid(ctx, boid);
  }

  // Check if the center of mass has reached the target
  const centerDistance = distance({ x: centerX, y: centerY }, { x: targetX, y: targetY });
  // console.log(centerDistance);
  if (centerDistance < 60000) {
    resetNavigationTime();
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);

  // Genetic Evolution
  frameCount++;
  if (frameCount % 100 === 0) {
    logMetrics();
    evolve();
  }
  
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the boids to start
  initBoids();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};

// Cohesion distance range
const minCohesionDistance = 50;
const maxCohesionDistance = 100;

// Assign random cohesion distances to each boid
function initCohesionDistances() {
  for (let boid of boids) {
    boid.cohesionDistance = minCohesionDistance + Math.random() * (maxCohesionDistance - minCohesionDistance);
  }
}

// Genetic algorithm parameters
const mutationRate = 0.1;
const elitismCount = numBoids;
const populationSize = 2 * elitismCount;

// Fitness function
function calculateFitness(boid) {
  let cohesionFitness = 0;
  let separationFitness = 0;

  for (let otherBoid of boids) {
    const dist = distance(boid, otherBoid);
    if (dist < boid.cohesionDistance) {
      cohesionFitness += 1 / dist;
    } else if (dist < visualRange) {
      separationFitness += 1 / dist;
    }
  }

  return cohesionFitness + separationFitness;
}

// Genetic algorithm functions
function mutate(boid) {
  if (Math.random() < mutationRate) {
    boid.cohesionDistance = minCohesionDistance + Math.random() * (maxCohesionDistance - minCohesionDistance);
  }
}

function crossover(parent1, parent2) {
  const child = {
    cohesionDistance: (parent1.cohesionDistance + parent2.cohesionDistance) / 2
  };
  mutate(child);
  return child;
}

function evolve() {
  const newPopulation = [];

  // Elitism: Carry over the fittest individuals
  const sortedBoids = boids.slice().sort((a, b) => calculateFitness(b) - calculateFitness(a));
  for (let i = 0; i < elitismCount; i++) {
    newPopulation.push(sortedBoids[i]);
  }

  // Crossover and mutation
  while (newPopulation.length < populationSize) {
    const parent1 = boids[Math.floor(Math.random() * boids.length)];
    const parent2 = boids[Math.floor(Math.random() * boids.length)];
    newPopulation.push(crossover(parent1, parent2));
  }

  boids = newPopulation;
}


// Evaluation
function logMetrics() {
  const averageFlockCohesion = calculateAverageFlockCohesion();
  const navigationTime = getNavigationTime();

  console.log(`Average flock cohesion: ${averageFlockCohesion}`);
  console.log(`Navigation time: ${navigationTime === null ? 'N/A' : `${navigationTime / 1000} seconds`}`);
}

function calculateAverageFlockCohesion() {
  let totalCohesion = 0;
  let numBoidPairs = 0;

  for (let i = 0; i < boids.length; i++) {
    for (let j = i + 1; j < boids.length; j++) {
      const dist = distance(boids[i], boids[j]);
      if (dist < visualRange) {
        totalCohesion += 1 / dist;
        numBoidPairs++;
      }
    }
  }

  if (numBoidPairs === 0) {
    return 0;
  }

  return totalCohesion / numBoidPairs;
}

// Target location for navigation
const targetX = width / 2;
const targetY = height / 2;

// Time when navigation started
let navigationStartTime = null;

function resetNavigationTime() {
  // console.log(performance.now());
  navigationStartTime = performance.now();
}

function getNavigationTime() {
  if (navigationStartTime === null) {
    return null;
  }
  return performance.now() - navigationStartTime;
}