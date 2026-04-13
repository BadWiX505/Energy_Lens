import geminiService, { EnergyUsageData } from './gemeni.service';
import { getImageUrl } from './gemeni.scrapper';
import { EnergyTip, AiTipNormalized, normalizeAiTip } from '../../modules/tips/tips.types';
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
You are "Sparky," a friendly and encouraging energy-saving buddy. Your job is to look at home electricity data and find "energy leaks" in a way that anyone—from a 10-year-old to a grandparent—can understand.

Your goal is to provide 3 fun, easy-to-follow, and highly actionable tips based on the user's specific data.

TONE & STYLE GUIDELINES:
- Friendly & Generative: Use warm, encouraging language. Instead of "Optimize HVAC," say "Give your heater a nap."
- Simple Language: No technical jargon (avoid terms like "peak load" or "kilowatt-hours"). Use metaphors like "vampire power" or "energy hogs."
- For Everyone: Write so that a non-technical person feels empowered, not lectured.

STRICT OUTPUT RULES:
1. Respond ONLY with a raw JSON array.
2. No markdown formatting (no \`\`\`json), no greetings, and no conversational filler.
3. Use the following schema:

[
  {
    "imageDescription": "A brief but well defined description of the image to search that describes the tip well (e.g., 'energy saving lamp').",
    "title": "A friendly, catchy title (max 6 words).",
    "description": "Explain the tip like a helpful friend. Use simple words to explain what the data shows and how to fix it (max 2 sentences).",
    "categoryTag": "One simple word (e.g., 'Kitchen', 'Bedtime', 'Sunshine', 'Laundry').",
    "estimatedSavings": "A realistic estimate (e.g., '~8% savings')."
  }
]

DATA ANALYSIS TASKS:
- Look for "Vampire Power": If night usage is high, suggest unplugging "sleeping" electronics.
- Look for "Energy Hogs": If there are big spikes, suggest using large machines (like the dryer) at different times.
- Look for "Overwork": If usage is constant, suggest giving the heater or AC a small break.

Important : tips must be in french language
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

        const normalizedTips: AiTipNormalized[] = [];
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
            normalizedTips.push(normalized);

            if (normalized.validationErrors && normalized.validationErrors.length > 0) {
                console.debug(`[getTips] Tip "${normalized.title}" had validation fixes:`, normalized.validationErrors);
            }
        }

        // ────────────────────────────────────────────────────────────────────
        // Cap to MAX_TIPS then scrape images in parallel
        // ────────────────────────────────────────────────────────────────────

        const MAX_TIPS = 3;
        const cappedNormalized = normalizedTips.slice(0, MAX_TIPS);

        if (cappedNormalized.length === 0) {
            console.warn('[getTips] No valid tips generated from AI response');
            return null;
        }

        // Call image scrapper for each tip in parallel
        const imageResults = await Promise.all(
            cappedNormalized.map((t) => getImageUrl(t.imageDescription))
        );

        const cappedTips: EnergyTip[] = cappedNormalized.map((t, i) => ({
            imageUrls: imageResults[i] ?? [],
            title: t.title,
            description: t.description,
            categoryTag: t.categoryTag,
            estimatedSavings: t.estimatedSavings,
        }));

        console.log(`[getTips] Successfully generated ${cappedTips.length} tips`);
        console.dir(cappedTips, { depth: null });

        return cappedTips;

    } catch (unexpectedError: any) {
        console.error('[getTips] Unexpected error during tip generation:', unexpectedError?.message || unexpectedError);
        return null;
    }
}