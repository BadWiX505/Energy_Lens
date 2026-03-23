import {client} from './mqtt_client.js';

// Starting point for the accumulated energy meter
let totalEnergyKWh = 1250.5; 

function generateEnergyMetrics() {
  // Simulate standard household voltage fluctuating around 230V
  const voltage = 230 + (Math.random() * 4 - 2); 
  
  // Simulate household current draw between 2A and 15A
  const current = 2 + (Math.random() * 13); 
  
  // Calculate Power (Watts) with a simulated power factor of 0.95
  const powerW = voltage * current * 0.95; 
  
  // Convert to kW and calculate accumulated energy over the 5-second interval
  const powerKW = powerW / 1000;
  const hoursElapsed = 5 / 3600; 
  totalEnergyKWh += (powerKW * hoursElapsed);
  const frequency = 50 + (Math.random() * 0.5 - 0.25); // Simulate frequency around 50Hz

  // Return the structured data
  return {
    timestamp: new Date().toISOString(),
    tags : {
      device_id: 'energy_meter_001',
    },
    metrics: {
      voltage: parseFloat(voltage.toFixed(2)),
      current: parseFloat(current.toFixed(2)),
      power_watts: parseFloat(powerW.toFixed(2)),
      energy_kwh: parseFloat(totalEnergyKWh.toFixed(4)),
      frequency: parseFloat(frequency.toFixed(2)) // Simulate frequency around 50Hz
    }
  };
}

// Execute the generation function every 5000ms (5 seconds)
setInterval(() => {
  const latestData = generateEnergyMetrics();
  client.publish('home/energy/data', JSON.stringify(latestData), { qos: 1, retain: false }, (error) => {
    if (error) {
      console.error('Failed to publish message:', error);
    } else {
      console.log(`Published energy metrics at ${latestData.timestamp}`);
    }
  });
  
  // For debugging purposes, also log the generated data to the console
  console.log(JSON.stringify(latestData, null, 2));
}, 5000);