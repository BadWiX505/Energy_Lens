import geminiService, { EnergyUsageData } from './gemeni.service';
import { EnergyTip, normalizeAiTip } from '../../modules/tips/tips.types';
export async function processTip(usage: EnergyUsageData, message: string): Promise<EnergyTip[] | null> {
    const usageDataMessage: EnergyUsageData = usage;
    const advisoryContext: string = message;

    console.log("Analyzing device data...");
    const result = await geminiService.generateResult(usageDataMessage, advisoryContext);

    if (result.success && result.data) {
        try {
            // Type the parsed response strictly against the new interface
            const tips: EnergyTip[] = JSON.parse(result.data);

            console.log("Success! Here are the formatted tips:");
            console.dir(tips, { depth: null });

            // Return the array for your UI to map over
            return tips;

        } catch (parseError) {
            console.error("Failed to parse the AI response as JSON.", result.data);
            return null;
        }
    } else {
        console.error("Operation failed:", result.error);
        return null;
    }
}


export async function getTips(usageContext: EnergyUsageData): Promise<EnergyTip[] | null> {
    const SYSTEM_ADVISORY_PROMPT = `
You are an expert energy-saving advisory system analyzing home electricity consumption data.
Your objective is to provide max 3 highly actionable, specific tips to reduce consumption based on the user's data.

STRICT OUTPUT RULES:
1. You must respond ONLY with a raw JSON array.
2. Do not include any markdown formatting (like \`\`\`json), conversational text, greetings, or explanations.
3. Every object in the array MUST adhere exactly to the following JSON schema:

[
  {
    "iconName": "A valid Lucide icon name in PascalCase that represents the tip (e.g., 'Lightbulb', 'Zap', 'PowerOff', 'Thermometer', 'Wind').",
    "title": "A short, punchy title summarizing the action (max 6 words).",
    "description": "A specific, actionable explanation based strictly on the provided data (max 2 sentences).",
    "categoryTag": "A single word categorizing the tip (e.g., 'Lighting', 'Appliances', 'HVAC', 'Habits').",
    "estimatedSavings": "A realistic percentage estimate formatted exactly like '~X% savings' (e.g., '~5% savings')."
  }
]

GUIDELINES FOR QUALITY TIPS:
- Base tips on actual consumption patterns in the data provided.
- If data shows high HVAC usage, suggest thermostat optimization.
- If data shows high peak power, suggest load shifting.
- If data shows anomalies, suggest investigation of specific devices.
- If data shows night-time usage above threshold, suggest scheduling changes.
- Make savings estimates realistic (3-15% range typical).
- Avoid generic tips; reference actual numbers from the data.
`;

    // Prepare and validate usage context data
    if (!usageContext || Object.keys(usageContext).length === 0) {
        console.warn('[getTips] Empty usage context provided, returning null');
        return null;
    }

    console.log('[getTips] Preparing usage data for AI analysis...');
    
    try {
        // Call Gemini with enriched context
        const result = await geminiService.generateResult(usageContext, SYSTEM_ADVISORY_PROMPT);

        if (!result.success || !result.data) {
            console.error('[getTips] AI generation failed:', result.error);
            return null;
        }

        // ────────────────────────────────────────────────────────────────────
        // Parse and validate AI response with robust error handling
        // ────────────────────────────────────────────────────────────────────

        let parsedTips: unknown[];
        try {
            // Clean response: remove markdown code blocks if present
            let cleanData = result.data.trim();
            if (cleanData.startsWith('```')) {
                cleanData = cleanData
                    .replace(/^```(?:json)?\s*/, '')
                    .replace(/```\s*$/, '')
                    .trim();
            }

            parsedTips = JSON.parse(cleanData);
        } catch (parseError) {
            console.error('[getTips] Failed to parse AI JSON response:', result.data);
            return null;
        }

        // Validate parsed output is array
        if (!Array.isArray(parsedTips)) {
            console.error('[getTips] AI response is not an array:', typeof parsedTips);
            return null;
        }

        // ────────────────────────────────────────────────────────────────────
        // Normalize and validate each tip
        // ────────────────────────────────────────────────────────────────────

        const normalizedTips: EnergyTip[] = [];
        const seenTitles = new Set<string>(); // Dedupe by title

        for (const rawTip of parsedTips) {
            const normalized = normalizeAiTip(rawTip);
            
            if (!normalized) {
                console.warn('[getTips] Skipping unparseable tip:', rawTip);
                continue;
            }

            // Dedupe: skip if we've already seen this title
            if (seenTitles.has(normalized.title.toLowerCase())) {
                console.debug('[getTips] Skipping duplicate tip title:', normalized.title);
                continue;
            }

            seenTitles.add(normalized.title.toLowerCase());
            normalizedTips.push({
                iconName: normalized.iconName,
                title: normalized.title,
                description: normalized.description,
                categoryTag: normalized.categoryTag,
                estimatedSavings: normalized.estimatedSavings,
            });

            if (normalized.validationErrors && normalized.validationErrors.length > 0) {
                console.debug(`[getTips] Tip "${normalized.title}" had validation fixes:`, normalized.validationErrors);
            }
        }

        // ────────────────────────────────────────────────────────────────────
        // Return capped result (max N tips)
        // ────────────────────────────────────────────────────────────────────

        const MAX_TIPS = 3; // Return up to 3 tips per generation
        const cappedTips = normalizedTips.slice(0, MAX_TIPS);

        if (cappedTips.length === 0) {
            console.warn('[getTips] No valid tips generated from AI response');
            return null;
        }

        console.log(`[getTips] Successfully generated ${cappedTips.length} tips`);
        console.dir(cappedTips, { depth: null });

        return cappedTips;

    } catch (unexpectedError: any) {
        console.error('[getTips] Unexpected error during tip generation:', unexpectedError?.message || unexpectedError);
        return null;
    }
}