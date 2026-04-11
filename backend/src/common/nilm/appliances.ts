// ===============================
// APPLIANCE DICTIONARY
// ===============================

import { ApplianceProfile } from "./nilm";

export const APPLIANCES: ApplianceProfile[] = [
    {
        name: "kettle",
        category: "kitchen",
        powerRange: [1500, 2500],
        typicalDurationSec: [60, 300],
        pattern: "short_burst",
        icon: "Coffee", // Lucide doesn't have a kettle, Coffee is the standard alternative
        color: "#ef4444" // red-500 (heat/boiling)
    },
    {
        name: "fridge",
        category: "always_on",
        powerRange: [80, 200],
        typicalDurationSec: [600, 1800],
        pattern: "cyclic",
        icon: "Refrigerator",
        color: "#3b82f6" // blue-500 (cold)
    },
    {
        name: "washing_machine",
        category: "laundry",
        powerRange: [300, 2500],
        typicalDurationSec: [1800, 7200],
        pattern: "variable",
        icon: "WashingMachine",
        color: "#06b6d4" // cyan-500 (water/cleaning)
    },
    {
        name: "microwave",
        category: "kitchen",
        powerRange: [800, 1500],
        typicalDurationSec: [60, 600],
        pattern: "short_burst",
        icon: "Microwave",
        color: "#f59e0b" // amber-500 (radiation/heat)
    },
    {
        name: "air_conditioner",
        category: "hvac",
        powerRange: [1000, 3000],
        typicalDurationSec: [1800, 14400],
        pattern: "variable",
        icon: "AirVent",
        color: "#0ea5e9" // sky-500 (breeze/air)
    },
    {
        name: "electric_oven",
        category: "kitchen",
        powerRange: [2000, 5000],
        typicalDurationSec: [1800, 7200],
        pattern: "variable",
        icon: "CookingPot", // Alternatively "Flame" or "UtensilsCrossed"
        color: "#ea580c" // orange-600 (baking/high heat)
    },
    {
        name: "tv",
        category: "entertainment",
        powerRange: [50, 200],
        typicalDurationSec: [1800, 14400],
        pattern: "variable",
        icon: "Tv",
        color: "#8b5cf6" // violet-500 (screens/entertainment)
    },
    {
        name: "laptop",
        category: "electronics",
        powerRange: [30, 100],
        typicalDurationSec: [1800, 28800],
        pattern: "variable",
        icon: "Laptop",
        color: "#64748b" // slate-500 (technology/metal)
    }
];