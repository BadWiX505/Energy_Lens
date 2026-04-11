// ===============================
// NILM LIBRARY (TypeScript)
// ===============================

// -------- TYPES --------
export type EventType = "ON" | "OFF";

export interface PowerEvent {
    timestamp: string;
    deltaPower: number; // positive for ON, negative for OFF
    type: EventType;
}


export interface ApplianceProfile {
    name: string;
    category:
    | "kitchen"
    | "hvac"
    | "entertainment"
    | "laundry"
    | "always_on"
    | "electronics"
    | "other";

    powerRange: [number, number];
    typicalDurationSec: [number, number];
    pattern: "short_burst" | "cyclic" | "variable";
}

export interface ActiveAppliance {
    name: string;
    power: number;
    startedAt: number;
}

export interface DetectedUsage {
    appliance: string;
    startTime: string;
    endTime: string;
    durationSec: number;
    energyKWh: number;
}

// -------- APPLIANCE DICTIONARY (moved to separate file) --------
import { APPLIANCES } from "./appliances";

// -------- UTILS --------
const TOLERANCE = 150;

function approxEqual(a: number, b: number): boolean {
    return Math.abs(a - b) <= TOLERANCE;
}

function toSeconds(ts: string): number {
    return new Date(ts).getTime() / 1000;
}

// -------- SCORING --------
function powerScore(profile: ApplianceProfile, power: number): number {
    const [min, max] = profile.powerRange;
    if (power >= min && power <= max) return 1;
    const dist = Math.min(Math.abs(power - min), Math.abs(power - max));
    return Math.max(0, 1 - dist / max);
}

function durationScore(profile: ApplianceProfile, duration: number): number {
    const [min, max] = profile.typicalDurationSec;
    if (duration >= min && duration <= max) return 1;
    const dist = Math.min(Math.abs(duration - min), Math.abs(duration - max));
    return Math.max(0, 1 - dist / max);
}

function patternScore(profile: ApplianceProfile, power: number): number {
    if (profile.pattern === "short_burst" && power > 1000) return 1;
    if (profile.pattern === "cyclic" && power < 300) return 0.8;
    return 0.5;
}

function scoreAppliance(profile: ApplianceProfile, power: number): number {
    return (
        0.6 * powerScore(profile, power) +
        0.4 * patternScore(profile, power)
    );
}

// -------- CORE ENGINE --------
export class NILMEngine {
    private active: ActiveAppliance[] = [];
    private usages: DetectedUsage[] = [];

    process(events: PowerEvent[]): DetectedUsage[] {
        for (const event of events) {
            if (event.type === "ON") {
                this.handleOn(event);
            } else {
                this.handleOff(event);
            }
        }
        return this.usages;
    }

    private handleOn(event: PowerEvent) {
        const power = event.deltaPower;

        const scored = APPLIANCES.map(p => ({
            profile: p,
            score: scoreAppliance(p, power)
        })).sort((a, b) => b.score - a.score);

        const best = scored[0].profile;

        this.active.push({
            name: best.name,
            power,
            startedAt: toSeconds(event.timestamp)
        });
    }

    private handleOff(event: PowerEvent) {
        const target = Math.abs(event.deltaPower);

        // Try exact match
        let matchIndex = this.active.findIndex(a => approxEqual(a.power, target));

        if (matchIndex === -1) {
            // Try combinations
            const combo = this.findCombination(target);
            if (combo.length > 0) {
                combo.forEach(idx => this.closeAppliance(idx, event.timestamp));
                return;
            }
            return;
        }

        this.closeAppliance(matchIndex, event.timestamp);
    }

    private closeAppliance(index: number, endTimestamp: string) {
        const appliance = this.active[index];
        const end = toSeconds(endTimestamp);

        const duration = end - appliance.startedAt;
        const energy = (appliance.power * duration) / 3600 / 1000;

        this.usages.push({
            appliance: appliance.name,
            startTime: new Date(appliance.startedAt * 1000).toISOString(),
            endTime: endTimestamp,
            durationSec: duration,
            energyKWh: energy
        });

        this.active.splice(index, 1);
    }

    private findCombination(target: number): number[] {
        const results: number[][] = [];

        const backtrack = (start: number, sum: number, path: number[]) => {
            if (approxEqual(sum, target)) {
                results.push([...path]);
                return;
            }

            for (let i = start; i < this.active.length; i++) {
                path.push(i);
                backtrack(i + 1, sum + this.active[i].power, path);
                path.pop();
            }
        };

        backtrack(0, 0, []);

        return results.length > 0 ? results[0] : [];
    }
}

// -------- USAGE EXAMPLE --------

/*
const engine = new NILMEngine();

const events: PowerEvent[] = [
  { timestamp: "2026-04-08T12:00:00Z", deltaPower: 1000, type: "ON" },
  { timestamp: "2026-04-08T12:01:00Z", deltaPower: 1100, type: "ON" },
  { timestamp: "2026-04-08T12:03:00Z", deltaPower: -1000, type: "OFF" }
];

const result = engine.process(events);
console.log(result);
*/
