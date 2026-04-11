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
        pattern: "short_burst"
    },
    {
        name: "fridge",
        category: "always_on",
        powerRange: [80, 200],
        typicalDurationSec: [600, 1800],
        pattern: "cyclic"
    },
    {
        name: "washing_machine",
        category: "laundry",
        powerRange: [300, 2500],
        typicalDurationSec: [1800, 7200],
        pattern: "variable"
    },
    {
        name: "microwave",
        category: "kitchen",
        powerRange: [800, 1500],
        typicalDurationSec: [60, 600],
        pattern: "short_burst"
    },
    {
        name: "air_conditioner",
        category: "hvac",
        powerRange: [1000, 3000],
        typicalDurationSec: [1800, 14400],
        pattern: "variable"
    },
    {
        name: "electric_oven",
        category: "kitchen",
        powerRange: [2000, 5000],
        typicalDurationSec: [1800, 7200],
        pattern: "variable"
    },
    {
        name: "tv",
        category: "entertainment",
        powerRange: [50, 200],
        typicalDurationSec: [1800, 14400],
        pattern: "variable"
    },
    {
        name: "laptop",
        category: "electronics",
        powerRange: [30, 100],
        typicalDurationSec: [1800, 28800],
        pattern: "variable"
    }
];