/**
 * Tips Domain Types
 * Structures for tip persistence, AI output normalization, and API contracts
 */

// ────────────────────────────────────────────────────────────────────────────
// Frontend/API Types (what clients receive)
// ────────────────────────────────────────────────────────────────────────────

export interface EnergyTip {
    imageUrls: string[];      // Up to 5 scraped image URLs (may be empty)
    title: string;            // e.g., 'Switch to LED Bulbs' (max 6 words)
    description: string;      // e.g., 'LED bulbs use 75% less energy...' (max 2 sentences)
    categoryTag: string;      // e.g., 'Lighting', 'HVAC', 'Appliances', 'Habits'
    estimatedSavings: string; // e.g., '~8% savings'
}

// ────────────────────────────────────────────────────────────────────────────
// Database/Persistence Types
// ────────────────────────────────────────────────────────────────────────────

/** Tip model as persisted to database */
export interface TipModel {
    id: string;
    homeId: string;
    imageUrls: string[];
    title: string | null;
    description: string | null;
    categoryTag: string | null;
    estimatedSavings: string | null;
    sourceDeviceId?: string | null;
    metadata?: Record<string, any> | null;
    createdAt: Date;
    generatedAt: Date;
}

/** API response DTO mapping from TipModel */
export interface TipResponseDto {
    id: string;
    homeId: string;
    imageUrls: string[];
    title: string;
    description: string;
    categoryTag: string;
    estimatedSavings: string;
    sourceDeviceId?: string;
    createdAt: string; // ISO 8601
    generatedAt: string; // ISO 8601
}

// ────────────────────────────────────────────────────────────────────────────
// AI Output Types
// ────────────────────────────────────────────────────────────────────────────

/** Raw AI response before validation (per tip object) */
export interface AiTipRaw {
    imageDescription?: string | null;
    title?: string | null;
    description?: string | null;
    categoryTag?: string | null;
    estimatedSavings?: string | null;
    [key: string]: any; // Allow extra fields from AI
}

/** Normalized, validated AI tip — includes imageDescription for scrapper use */
export interface AiTipNormalized extends EnergyTip {
    imageDescription: string;  // passed through for the scrapper call
    isValid: boolean;
    validationErrors?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Input/Request Types
// ────────────────────────────────────────────────────────────────────────────

export interface CreateTipInput {
    homeId: string;
    imageUrls?: string[];
    title: string;
    description: string;
    categoryTag: string;
    estimatedSavings: string;
    sourceDeviceId?: string;
    metadata?: Record<string, any>;
}

// ────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Normalize AI tip response with runtime-safe defaults.
 * imageUrls starts empty — the caller (gemeni.process.ts) fills it after scraping.
 */
export function normalizeAiTip(rawTip: unknown): AiTipNormalized | null {
    if (!rawTip || typeof rawTip !== 'object') {
        return null;
    }

    const raw = rawTip as AiTipRaw;
    const errors: string[] = [];

    // Pass through imageDescription for scrapper use (no validation — any string is acceptable)
    const imageDescription = (raw.imageDescription as string | undefined)?.trim() || 'energy saving';

    // Sanitize title (max 6 words, required)
    let title = (raw.title as string | undefined)?.trim() || '';
    if (!title || typeof title !== 'string') {
        errors.push('Invalid or missing title');
        title = 'Energy Saving Tip';
    }
    if (title.split(/\s+/).length > 6) {
        title = title.split(/\s+/).slice(0, 6).join(' ');
    }

    // Sanitize description (max 2 sentences, required)
    let description = (raw.description as string | undefined)?.trim() || '';
    if (!description || typeof description !== 'string') {
        errors.push('Invalid or missing description');
        description = 'Apply this tip to reduce energy consumption.';
    }
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 2) {
        description = sentences.slice(0, 2).join('. ') + '.';
    }

    // Sanitize categoryTag (single word, required)
    let categoryTag = (raw.categoryTag as string | undefined)?.trim() || '';
    if (!categoryTag || typeof categoryTag !== 'string' || categoryTag.includes(' ')) {
        errors.push('Invalid or missing categoryTag (must be single word)');
        categoryTag = 'General';
    }

    // Sanitize estimatedSavings
    let estimatedSavings = (raw.estimatedSavings as string | undefined)?.trim() || '';
    if (!estimatedSavings || typeof estimatedSavings !== 'string') {
        errors.push('Invalid or missing estimatedSavings');
        estimatedSavings = '~3% savings';
    }
    if (!estimatedSavings.includes('%') || !estimatedSavings.includes('savings')) {
        estimatedSavings = '~3% savings';
    }

    return {
        imageDescription,
        imageUrls: [],  // filled by the scrapper call in gemeni.process.ts
        title,
        description,
        categoryTag,
        estimatedSavings,
        isValid: errors.length === 0,
        validationErrors: errors.length > 0 ? errors : undefined,
    };
}

/**
 * Map TipModel (database) to TipResponseDto (API response)
 */
export function mapTipModelToDto(model: TipModel): TipResponseDto {
    return {
        id: model.id,
        homeId: model.homeId,
        imageUrls: model.imageUrls ?? [],
        title: model.title || 'Energy Tip',
        description: model.description || 'Apply this tip to save energy.',
        categoryTag: model.categoryTag || 'General',
        estimatedSavings: model.estimatedSavings || '~3% savings',
        ...(model.sourceDeviceId && { sourceDeviceId: model.sourceDeviceId }),
        createdAt: model.createdAt.toISOString(),
        generatedAt: model.generatedAt.toISOString(),
    };
}