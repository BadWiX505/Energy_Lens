/**
 * Alerts Engine
 * Analyzes incoming MQTT streams and generates alerts using preference-based rules.
 * 
 * Features:
 * - 10 comprehensive alert rule types
 * - User preference-driven thresholds (maxPower, nightMode, dailyBudget, etc.)
 * - Power spike detection (30% deviation in 5-reading window)
 * - Sustained high consumption tracking (>10 min at 80% of max)
 * - Daily cost threshold management
 * - Device offline detection with timestamps
 * - In-memory caching to minimize DB load
 */

import { MQTTDevicePayload } from '../../common/websocket/socket.types';
import { prisma } from '../../common/config/prisma';
import type { AlertSeverity, AlertRuleType, AlertTrigger, CreateAlertInput } from './alerts.types';
import { AlertsRepository } from './alerts.repo';
import { emitAlertEvent } from '../../common/websocket/events/alerts.socket';

// ────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────────────────────────────────────────

interface PreferenceData {
  maxPowerThreshold: number;
  nightThreshold: number;
  nightHours: number[];        // e.g., [22, 23, 0, 1]
  pricePerKwh: number;
  dailyBudget: number;
  enableNotifications: boolean;
}

interface DeviceState {
  powerHistory: number[];       // Last 5 readings for spike detection
  lastSeenAt: number;           // Timestamp in ms
  consecutiveHighReadings: number; // For sustained high alert
  dailyEnergyAccum: number;     // kWh accumulated today
  hourOfLastReset: number;      // Track daily reset
}

interface RuleEvaluator {
  ruleType: AlertRuleType;
  name: string;
  severity: AlertSeverity;
  evaluate: (payload: MQTTDevicePayload, prefs: PreferenceData, state: DeviceState) => AlertTrigger | null;
}


// ────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Determines if current time is within night hours based on user preference
 */
function isNightTime(nightHours: number[], timestamp: number = Date.now()): boolean {
  if (!nightHours || nightHours.length === 0) return false;
  const hour = new Date(timestamp).getHours();
  return nightHours.includes(hour);
}

/**
 * Calculates power spike percentage: (current - avg) / avg * 100
 * Returns spike % if detected, 0 otherwise
 */
function calculatePowerSpike(currentPower: number, powerHistory: number[]): number {
  const spikeTreshold = 500; 
  if (powerHistory.length < 2) return 0;
  const avgPower = powerHistory.reduce((a, b) => a + b, 0) / powerHistory.length;
  if (avgPower === 0) return 0;
  if(currentPower - avgPower < spikeTreshold) return 0;
  const spike = ((currentPower - avgPower) / avgPower) * 100;
  return spike > 0 ? spike : 0;
}

/**
 * Default preferences when user has none configured
 */
function getDefaultPreferences(): PreferenceData {
  return {
    maxPowerThreshold: 3000,
    nightThreshold: 1000,
    nightHours: [22, 23, 0, 1, 2, 3, 4, 5],
    pricePerKwh: 0.15,
    dailyBudget: 50,
    enableNotifications: true,
  };
}

/**
 * Converts Preference model to PreferenceData
 */
function preferenceToData(pref: any): PreferenceData {
  const defaults = getDefaultPreferences();
  
  // Try to parse nightHours from a stored string/array format
  let nightHours = defaults.nightHours;
  // In practice, you may want to store this as JSON in the DB
  
  return {
    maxPowerThreshold: pref?.maxPowerThreshold ?? defaults.maxPowerThreshold,
    nightThreshold: pref?.nightThreshold ?? defaults.nightThreshold,
    nightHours,
    pricePerKwh: pref?.pricePerKwh ?? defaults.pricePerKwh,
    dailyBudget: pref?.enableNotifications === false ? Infinity : (pref?.dailyBudget ?? defaults.dailyBudget),
    enableNotifications: pref?.enableNotifications ?? defaults.enableNotifications,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Alert Rule Evaluators
// ────────────────────────────────────────────────────────────────────────────

const ALERT_RULES: RuleEvaluator[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. OVERVOLTAGE: voltage > 250V (critical safety threshold)
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'overvoltage',
    name: 'Critical Overvoltage',
    severity: 'critical',
    evaluate: (payload, _prefs, _state) => {
      const voltage = payload.metrics.voltage;
      if (voltage > 250) {
        return {
          ruleType: 'overvoltage',
          severity: 'critical',
          title: 'Critical Overvoltage Detected',
          message: `Voltage exceeds safe operating range: ${voltage.toFixed(1)}V detected. Disconnect sensitive devices immediately to prevent damage.`,
          metadata: { voltage, threshold: 250 },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. UNDERVOLTAGE: voltage < 180V (warning level)
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'undervoltage',
    name: 'Low Voltage Warning',
    severity: 'warning',
    evaluate: (payload, _prefs, _state) => {
      const voltage = payload.metrics.voltage;
      if (voltage > 0 && voltage < 180) {
        return {
          ruleType: 'undervoltage',
          severity: 'warning',
          title: 'Low Voltage Warning',
          message: `Voltage is significantly low: ${voltage.toFixed(1)}V. Device performance may degrade or shut down.`,
          metadata: { voltage, threshold: 180 },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MAX POWER: power > user's maxPowerThreshold (critical)
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'maxPower',
    name: 'Maximum Power Threshold Exceeded',
    severity: 'critical',
    evaluate: (payload, prefs, _state) => {
      const power = payload.metrics.power_watts;
      if (power > prefs.maxPowerThreshold) {
        return {
          ruleType: 'maxPower',
          severity: 'critical',
          title: 'Power Consumption Exceeds Limit',
          message: `Current power draw (${power.toFixed(0)}W) exceeds your configured maximum of ${prefs.maxPowerThreshold.toFixed(0)}W. Reduce load immediately.`,
          metadata: { power, threshold: prefs.maxPowerThreshold, exceedBy: power - prefs.maxPowerThreshold },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. NIGHT MODE: power > nightThreshold during configured night hours
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'nightMode',
    name: 'Night Mode Power Violation',
    severity: 'warning',
    evaluate: (payload, prefs, _state) => {
      const power = payload.metrics.power_watts;
      const timestamp = new Date(payload.timestamp || Date.now()).getTime();
      
      if (
        isNightTime(prefs.nightHours, timestamp) &&
        power > prefs.nightThreshold
      ) {
        const hour = new Date(timestamp).getHours();
        return {
          ruleType: 'nightMode',
          severity: 'warning',
          title: 'Night Mode Power Limit Exceeded',
          message: `Power usage (${power.toFixed(0)}W) exceeds night-time limit of ${prefs.nightThreshold.toFixed(0)}W at ${hour}:00. Consider deferring non-essential loads.`,
          metadata: { power, threshold: prefs.nightThreshold, currentHour: hour, nightHours: prefs.nightHours },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. POWER SPIKE: Sudden consumption increase >30% in 5-reading window
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'powerSpike',
    name: 'Unexpected Power Spike Detected',
    severity: 'warning',
    evaluate: (payload, _prefs, state) => {
      const power = payload.metrics.power_watts;
      
      // Don't trigger if not enough history
      if (state.powerHistory.length < 2) return null;
      
      const spike = calculatePowerSpike(power, state.powerHistory);
      if (spike > 30) {
        const avgPower = state.powerHistory.reduce((a, b) => a + b, 0) / state.powerHistory.length;
        return {
          ruleType: 'powerSpike',
          severity: 'warning',
          title: 'Unexpected Power Spike Detected',
          message: `Power spike detected: ${(spike).toFixed(1)}% increase from baseline (${avgPower.toFixed(0)}W → ${power.toFixed(0)}W). This may indicate appliance malfunction or unexpected load.`,
          metadata: { currentPower: power, avgPower, spikePercent: spike },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. DEVICE OFFLINE: No payload received for >2 minutes
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'deviceOffline',
    name: 'Device Offline',
    severity: 'critical',
    evaluate: (payload, _prefs, state) => {
      const now = Date.now();
      const timeSinceLastUpdate = (now - state.lastSeenAt) / 1000; // seconds
      
      // Device offline if we haven't heard from it in >120 seconds (2 minutes)
      // But only trigger if we have a baseline from previous readings
      if (state.lastSeenAt > 0 && timeSinceLastUpdate > 120) {
        return {
          ruleType: 'deviceOffline',
          severity: 'critical',
          title: 'Device Offline',
          message: `Device has not reported for ${Math.round(timeSinceLastUpdate / 60)} minutes. Check connection and power status.`,
          metadata: { secondsSinceLastUpdate: timeSinceLastUpdate, deviceId: payload.tags.device_id },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. LOW BATTERY: Battery <20% (if available in payload)
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'lowBattery',
    name: 'Low Battery Level',
    severity: 'warning',
    evaluate: (payload, _prefs, _state) => {
      const batteryLevel = (payload.metrics as any).battery_percent;
      
      if (typeof batteryLevel === 'number' && batteryLevel < 20 && batteryLevel >= 0) {
        return {
          ruleType: 'lowBattery',
          severity: 'warning',
          title: 'Low Battery Warning',
          message: `Device battery is critically low at ${batteryLevel.toFixed(0)}%. Device may disconnect when battery is depleted. Consider charging or replacing battery.`,
          metadata: { batteryLevel },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. SUSTAINED HIGH: Power >80% of max for >10 consecutive minutes
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'sustainedHigh',
    name: 'Prolonged High Consumption',
    severity: 'warning',
    evaluate: (payload, prefs, state) => {
      const power = payload.metrics.power_watts;
      const highThreshold = prefs.maxPowerThreshold * 0.8;
      
      if (power > highThreshold) {
        state.consecutiveHighReadings++;
        // Assuming 10+ readings over ~10 minutes (1 reading per ~60 seconds)
        if (state.consecutiveHighReadings >= 10) {
          return {
            ruleType: 'sustainedHigh',
            severity: 'warning',
            title: 'Sustained High Power Consumption',
            message: `Device has maintained high power (${power.toFixed(0)}W, >80% of max) for over 10 minutes. Review running appliances and consider reducing load.`,
            metadata: { currentPower: power, threshold80Percent: highThreshold, consecutiveReadings: state.consecutiveHighReadings },
          };
        }
      } else {
        state.consecutiveHighReadings = 0;
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. COST THRESHOLD: Daily cost exceeds user's dailyBudget
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'costThreshold',
    name: 'Daily Energy Budget Exceeded',
    severity: 'critical',
    evaluate: (payload, prefs, state) => {
      // Add this reading's energy contribution to daily accumulator
      const newEnergy = (payload.metrics.energy_kwh || 0) / 3600; // rough estimate per reading
      state.dailyEnergyAccum += newEnergy;
      
      const dailyCost = state.dailyEnergyAccum * prefs.pricePerKwh;
      
      if (dailyCost > prefs.dailyBudget) {
        const exceedBy = dailyCost - prefs.dailyBudget;
        return {
          ruleType: 'costThreshold',
          severity: 'critical',
          title: 'Daily Budget Exceeded',
          message: `Daily energy cost ($${dailyCost.toFixed(2)}) exceeds budget of $${prefs.dailyBudget.toFixed(2)} by $${exceedBy.toFixed(2)}. Reduce consumption to stay within budget.`,
          metadata: { dailyCost, dailyBudget: prefs.dailyBudget, exceededBy: exceedBy, accumulatedEnergy: state.dailyEnergyAccum },
        };
      }
      return null;
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. APPLIANCE ANOMALY: NILM detected unusual consumption pattern
  // ──────────────────────────────────────────────────────────────────────────
  {
    ruleType: 'applianceAnomaly',
    name: 'Appliance Consumption Anomaly',
    severity: 'info',
    evaluate: (payload, _prefs, _state) => {
      const anomalyScore = (payload.metrics as any).anomaly_score;
      const applianceName = (payload.metrics as any).anomaly_appliance;
      
      if (typeof anomalyScore === 'number' && anomalyScore > 0.5) {
        return {
          ruleType: 'applianceAnomaly',
          severity: 'info',
          title: 'Unusual Appliance Behavior Detected',
          message: `${applianceName || 'An appliance'} is consuming 50%+ more than its typical baseline. This may indicate inefficiency or malfunction.`,
          metadata: { anomalyScore, appliance: applianceName },
        };
      }
      return null;
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Core Engine
// ────────────────────────────────────────────────────────────────────────────

export class AlertsEngine {
  private repo = new AlertsRepository();

  // Caches to minimize DB queries during MQTT cycles
  private deviceToHomeCache: Map<string, string | null> = new Map();
  private preferencesCache: Map<string, { data: PreferenceData; fetchedAt: number }> = new Map();
  private deviceStateMap: Map<string, DeviceState> = new Map();

  // Cooldown tracking: key = `${deviceId}:${ruleType}`, value = lastFiredAt timestamp (ms)
  private alertCooldownMap: Map<string, number> = new Map();

  private readonly CACHE_TTL_MS = 60000;   // 60 seconds
  private readonly MAX_POWER_HISTORY = 5;
  private readonly ALERT_COOLDOWN_MS = 1 * 60 * 1000; // 1 minute per device per rule

  /**
   * Resolves homeId from deviceId with caching
   */
  private async resolveHomeId(deviceId: string): Promise<string | null> {
    if (this.deviceToHomeCache.has(deviceId)) {
      return this.deviceToHomeCache.get(deviceId)!;
    }

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { homeId: true },
    });

    const homeId = device?.homeId || null;
    this.deviceToHomeCache.set(deviceId, homeId);
    return homeId;
  }

  /**
   * Fetches user preferences for a home with caching (60 sec TTL)
   */
  private async getPreferences(homeId: string): Promise<PreferenceData> {
    const now = Date.now();
    const cached = this.preferencesCache.get(homeId);
    
    if (cached && now - cached.fetchedAt < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const pref = await prisma.preference.findFirst({
        where: { homeId },
        orderBy: { createdAt: 'desc' },
      });
      
      const data = preferenceToData(pref);
      this.preferencesCache.set(homeId, { data, fetchedAt: now });
      return data;
    } catch (err) {
      console.error('[AlertsEngine] Error fetching preferences:', err);
      return getDefaultPreferences();
    }
  }

  /**
   * Gets or initializes device state for tracking power, cost, etc.
   */
  private getOrInitializeDeviceState(deviceId: string): DeviceState {
    if (this.deviceStateMap.has(deviceId)) {
      return this.deviceStateMap.get(deviceId)!;
    }

    const state: DeviceState = {
      powerHistory: [],
      lastSeenAt: Date.now(),
      consecutiveHighReadings: 0,
      dailyEnergyAccum: 0,
      hourOfLastReset: new Date().getHours(),
    };

    this.deviceStateMap.set(deviceId, state);
    return state;
  }

  /**
   * Updates power history and checks for daily reset
   */
  private updateDeviceState(deviceId: string, power: number, timestamp: number) {
    const state = this.getOrInitializeDeviceState(deviceId);
    const currentHour = new Date(timestamp).getHours();

    // Reset daily accumulator if day has changed
    if (currentHour !== state.hourOfLastReset) {
      state.dailyEnergyAccum = 0;
      state.hourOfLastReset = currentHour;
    }

    // Update power history (keep last 5 readings)
    state.powerHistory.push(power);
    if (state.powerHistory.length > this.MAX_POWER_HISTORY) {
      state.powerHistory.shift();
    }

    // Update last seen timestamp
    state.lastSeenAt = timestamp;
  }

  /**
   * Main processing entrypoint: evaluates telemetry against all rules
   */
  async processPayload(payload: MQTTDevicePayload) {
    const deviceId = payload.tags.device_id;
    if (!deviceId) return;

    // Resolve home and preferences
    const homeId = await this.resolveHomeId(deviceId);
    if (!homeId) {
      console.warn(`[AlertsEngine] Device ${deviceId} not associated with a home.`);
      return;
    }

    const prefs = await this.getPreferences(homeId);
    if (!prefs.enableNotifications) {
      console.debug(`[AlertsEngine] Notifications disabled for home ${homeId}`);
      return;
    }

    // Update device state
    const timestamp = new Date(payload.timestamp || Date.now()).getTime();
    const power = payload.metrics.power_watts || 0;
    this.updateDeviceState(deviceId, power, timestamp);
    const state = this.getOrInitializeDeviceState(deviceId);

    // Evaluate all rules
    const triggered: AlertTrigger[] = [];
    for (const rule of ALERT_RULES) {
      const result = rule.evaluate(payload, prefs, state);
      if (result) {
        triggered.push(result);
      }
    }

    if (triggered.length === 0) return;

    // Persist and broadcast triggered alerts (with per-device-per-rule cooldown)
    const now = Date.now();
    for (const trigger of triggered) {
      const cooldownKey = `${deviceId}:${trigger.ruleType}`;
      const lastFiredAt = this.alertCooldownMap.get(cooldownKey) ?? 0;

      if (now - lastFiredAt < this.ALERT_COOLDOWN_MS) {
        console.debug(
          `[AlertsEngine] Skipping ${trigger.ruleType} for device ${deviceId} (cooldown: ${Math.round((this.ALERT_COOLDOWN_MS - (now - lastFiredAt)) / 1000)}s remaining)`
        );
        continue;
      }

      this.alertCooldownMap.set(cooldownKey, now);

      const alertInput: CreateAlertInput = {
        homeId,
        type: trigger.severity,
        ruleType: trigger.ruleType,
        message: trigger.message,
        metadata: trigger.metadata,
      };

      try {
        const savedAlert = await this.repo.createAlert(alertInput);
        console.log(`[AlertsEngine] Alert saved [${trigger.severity}] ${trigger.title}`);

        // Emit to WebSocket rooms
        emitAlertEvent({
          alertId: savedAlert.id,
          homeId,
          deviceId,
          title: trigger.title,
          description: trigger.message,
          severity: trigger.severity,
          timestamp: savedAlert.createdAt.toISOString(),
        });
      } catch (err) {
        console.error('[AlertsEngine] Failed to save/emit alert:', err);
      }
    }
  }

  /**
   * Clears all caches (call on device ownership changes, etc.)
   */
  clearCache() {
    this.deviceToHomeCache.clear();
    this.preferencesCache.clear();
    this.deviceStateMap.clear();
    this.alertCooldownMap.clear();
  }

  /**
   * Clears cache for a specific home (e.g., when prefs updated)
   */
  clearPreferenceCache(homeId: string) {
    this.preferencesCache.delete(homeId);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Export
// ────────────────────────────────────────────────────────────────────────────

export const alertsEngine = new AlertsEngine();

