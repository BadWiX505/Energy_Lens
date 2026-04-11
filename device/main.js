import { client } from './mqtt_client.js';

let totalEnergyKWh = 1250.5;
const UPDATE_INTERVAL_MS = 3000; // Faster rhythm: 1 second

// -------- SIMULATED APPLIANCES --------
const appliances = [
  {
    name: "fridge",
    power: 120,
    state: false,
    cycle: true,
    onDuration: 10 * 60,
    offDuration: 20 * 60,
    lastToggle: Date.now()
  },
  {
    name: "kettle",
    power: 2000,
    state: false,
    cycle: false,
    onDuration: 120,
    probability: 0.05 // Increased probability for more frequent activity
  },
  {
    name: "washing_machine",
    power: 800,
    state: false,
    cycle: false,
    onDuration: 3600,
    probability: 0.01
  },
  {
    name: "tv",
    power: 100,
    state: false,
    cycle: false,
    onDuration: 7200,
    probability: 0.03
  },
  {
    name: "ac",
    power: 1500,
    state: false,
    cycle: true,
    onDuration: 15 * 60,
    offDuration: 10 * 60,
    lastToggle: Date.now()
  }
];

const BASE_LOAD = 100;

// -------- HELPER: GAUSSIAN NOISE --------
const applyJitter = (value, percent = 0.05) => {
  const range = value * percent;
  return value + (Math.random() * range * 2 - range);
};

// -------- STATE UPDATE --------
function updateAppliances() {
  const now = Date.now();

  appliances.forEach(app => {
    if (app.cycle) {
      const elapsed = (now - app.lastToggle) / 1000;
      if (app.state && elapsed > app.onDuration) {
        app.state = false;
        app.lastToggle = now;
      } else if (!app.state && elapsed > app.offDuration) {
        app.state = true;
        app.lastToggle = now;
      }
    } else {
      if (!app.state && Math.random() < app.probability) {
        app.state = true;
        app.lastToggle = now;
      }
      if (app.state) {
        const elapsed = (now - app.lastToggle) / 1000;
        if (elapsed > app.onDuration) {
          app.state = false;
        }
      }
    }
  });
}

// -------- POWER CALCULATION --------
function computeTotalPower() {
  let total = BASE_LOAD;
  const now = Date.now();

  // Background line noise (fluctuates every second)
  total += (Math.random() * 15);

  appliances.forEach(app => {
    if (app.state) {
      const timeSinceStart = (now - app.lastToggle) / 1000;

      // Simulation of Inrush Current (Startup Spike)
      // High power draw for the first 3 seconds of switching on
      let currentPower = app.power;
      if (timeSinceStart < 3) {
        currentPower = app.power * 1.4; // 40% surge
      }

      total += applyJitter(currentPower, 0.08); // 8% variation for realism
    }
  });

  return total;
}

// -------- MAIN GENERATOR --------
function generateEnergyMetrics() {
  updateAppliances();

  const nowMs = Date.now();
  const timeSec = nowMs / 1000;

  // Grid Oscillations (Sine waves make the data look organic)
  const voltage = 230 + Math.sin(timeSec * 0.5) * 2 + (Math.random() - 0.5);
  const frequency = 50 + Math.sin(timeSec * 0.2) * 0.05 + (Math.random() * 0.02);

  const powerW = computeTotalPower();
  const current = powerW / voltage;

  // Energy accumulation logic adjusted for 1 second interval
  const powerKW = powerW / 1000;
  const hoursElapsed = UPDATE_INTERVAL_MS / (1000 * 3600);
  totalEnergyKWh += powerKW * hoursElapsed;

  return {
    timestamp: new Date().toISOString(),
    tags: {
      device_id: '550e8400-e29b-41d4-a716-446655440000',
    },
    metrics: {
      voltage: parseFloat(voltage.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      power_watts: parseFloat(powerW.toFixed(2)),
      energy_kwh: parseFloat(totalEnergyKWh.toFixed(5)), // More precision for fast updates
      frequency: parseFloat(frequency.toFixed(2))
    }
  };
}

// -------- LOOP --------
setInterval(() => {
  const data = generateEnergyMetrics();

  client.publish(
    'home/energy/data',
    JSON.stringify(data),
    { qos: 1, retain: false }
  );

  console.log(`[${data.timestamp}] Power: ${data.metrics.power_watts}W | V: ${data.metrics.voltage}V`);
}, UPDATE_INTERVAL_MS);