import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { DECK_SYSTEM_PROMPT, ONEPAGER_SYSTEM_PROMPT, FINANCIAL_SYSTEM_PROMPT } from './prompts';

dotenv.config();

// Create OpenAI client configured for DeepSeek API
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

const MODEL = 'deepseek-v4-flash';

/**
 * Generic wrapper to call DeepSeek with retry logic for strict JSON output and Zod validation.
 */
async function generateJson<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>, retryCount = 2): Promise<T> {
    try {
        const response = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Low temperature for deterministic, highly structural output
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        const parsed = JSON.parse(content);
        
        // Zod Runtime Validation
        return schema.parse(parsed);
        
    } catch (error: any) {
        if (retryCount > 0) {
            console.warn(`[AI] JSON generation or validation failed, retrying... (${retryCount} left). Error: ${error.message}`);
            return generateJson<T>(
                systemPrompt + `\n\nCRITICAL SYSTEM OVERRIDE: Your previous output failed validation. You MUST return ONLY a strictly valid JSON object matching the exact schema. Error details: ${error.message}`,
                userPrompt,
                schema,
                retryCount - 1
            );
        }
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Zod Schemas & Types
// ---------------------------------------------------------------------------

export const DeckBlueprintSchema = z.object({
    slides: z.array(z.object({
        title: z.string(),
        layout: z.enum(['title', 'title_and_body', 'two_column']),
        bodyText: z.string().optional(),
        bullets: z.array(z.string()).optional(),
        leftBullets: z.array(z.string()).optional(),
        rightBullets: z.array(z.string()).optional(),
    }))
});
export type DeckBlueprint = z.infer<typeof DeckBlueprintSchema>;

export const OnePagerBlueprintSchema = z.object({
    project_name: z.string(),
    executive_summary: z.string(),
    problem_statement: z.string(),
    solution: z.string(),
    market_opportunity: z.string(),
    token_utility: z.string(),
    team_or_roadmap: z.string(),
});
export type OnePagerBlueprint = z.infer<typeof OnePagerBlueprintSchema>;

export const FinancialBlueprintSchema = z.object({
    token_name: z.string(),
    total_supply: z.number(),
    initial_valuation: z.number(),
    distribution: z.object({
        team: z.number(),
        investors: z.number(),
        community: z.number(),
        treasury: z.number(),
    }),
    vesting: z.object({
        team_cliff_months: z.number(),
        investor_cliff_months: z.number(),
    })
});
export type FinancialBlueprint = z.infer<typeof FinancialBlueprintSchema>;

// ---------------------------------------------------------------------------
// Advanced AI Intelligence Layer
// ---------------------------------------------------------------------------

export async function generateDeckBlueprint(prompt: string): Promise<DeckBlueprint> {
    return generateJson<DeckBlueprint>(DECK_SYSTEM_PROMPT, prompt, DeckBlueprintSchema);
}

export async function generateOnePagerBlueprint(prompt: string): Promise<OnePagerBlueprint> {
    return generateJson<OnePagerBlueprint>(ONEPAGER_SYSTEM_PROMPT, prompt, OnePagerBlueprintSchema);
}

export async function generateFinancialBlueprint(prompt: string): Promise<FinancialBlueprint> {
    return generateJson<FinancialBlueprint>(FINANCIAL_SYSTEM_PROMPT, prompt, FinancialBlueprintSchema);
}
