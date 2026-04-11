import { GoogleGenAI } from "@google/genai";

// ════════════════════════════════════════════════════════════════════════════
// Energy Usage and Context Data Structures
// ════════════════════════════════════════════════════════════════════════════

/**
 * Per-device energy snapshot for tip context
 * Used to help AI understand consumption patterns by device/category
 */
export interface DeviceEnergySnapshot {
    deviceId?: string;
    deviceName?: string;
    deviceType?: string;                   // e.g., 'HVAC', 'Water Heater', 'Refrigerator'
    currentPowerWatts: number;              // Current draw
    last24hEnergyKwh: number;               // 24-hour consumption
    averagePowerWatts: number;              // 24-hour average
    peakPowerWatts: number;                 // 24-hour peak
    estimatedMonthlyKwh: number;            // Projected monthly from current usage
    percentOfTotalHome: number;             // % contribution to home's total load
}

/**
 * Home-level energy summary and context
 * This is the core data for AI tip generation
 */
export interface EnergyUsageData {
    // Home identification
    homeId: string;
    homeName?: string;

    // Aggregate home consumption (time windows)
    totalLast24hEnergyKwh: number;
    totalLast7dAverageKwh: number;          // Daily average over last 7 days
    peakPowerWattsLast24h: number;          // Peak load in 24h window
    averagePowerWattsLast24h: number;       // Average load in 24h window

    // Cost context
    estimatedMonthlyCostUsd?: number;
    dailyBudgetUsd?: number;
    pricePerKwhUsd?: number;

    // Anomaly and pattern detection
    hasRecentPowerSpikes?: boolean;         // >30% deviation detected
    hasNightTimeHighUsage?: boolean;        // Usage above threshold during night
    hasHighPeakMorningNight?: boolean;      // Peak occurs outside expected hours
    recentAnomaliesCount?: number;          // Number of alerts triggered recently

    // Device-level breakdown (top consumers)
    topDevices?: DeviceEnergySnapshot[];    // Top 3-5 consuming devices

    // User preferences and thresholds
    maxPowerThresholdWatts?: number;
    nightThresholdWatts?: number;
    dailyTargetKwh?: number;

    // Trend and comparison
    weeklyTrendPercent?: number;            // % change vs previous week (-5 = 5% decrease)
    comparisonToTarget?: number;            // % above/below user's daily goal
    isAboveAverageUsage?: boolean;          // Compared to user's typical pattern

    // Optional audit trail
    timestamp?: string;                     // When this data was collected
    dataSourceDevices?: string[];           // Which device IDs contributed to this summary
    [key: string]: any;                     // Allow additional fields for flexibility
}

// ════════════════════════════════════════════════════════════════════════════
// Gemini Service Response & Configuration
// ════════════════════════════════════════════════════════════════════════════

/** Standard response structure for Gemini API calls */

// 2. Define a standard response structure for your API calls
export interface GeminiResult<T = string> {
    success: boolean;
    data: T | null;
    error: string | null;
}

class GeminiService {
    private ai: GoogleGenAI;
    private defaultModel: string;

    constructor() {
        // Initializes the SDK using process.env.GEMINI_API_KEY
        this.ai = new GoogleGenAI({});
        this.defaultModel = "gemini-2.5-flash";
    }

    /**
     * Processes a message with a given context and returns a standardized result.
     * @param message - The data or prompt you want to send.
     * @param context - The system instructions setting the rules/persona.
     * @returns A Promise resolving to a GeminiResult object.
     */
   public async generateResult(
        message: string | Record<string, any>, 
        context: string
    ): Promise<GeminiResult> {
        try {
            const promptContents: string = typeof message === 'object' 
                ? JSON.stringify(message, null, 2) 
                : message;

            // FIX: Added `.models.` before `generateContent`
            const response = await this.ai.models.generateContent({
                model: this.defaultModel,
                contents: promptContents,
                config: {
                    systemInstruction: context,
                    temperature: 0.2, 
                }
            });

            return {
                success: true,
                data: response.text || "No response generated.",
                error: null
            };

        } catch (error: any) {
            console.error("[GeminiService] Error:", error.message);
            
            return {
                success: false,
                data: null,
                error: `Failed to generate response: ${error.message}`
            };
        }
    }
}

// Export a singleton instance
export default new GeminiService();