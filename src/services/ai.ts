import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Create OpenAI client configured for DeepSeek API
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

const MODEL = 'deepseek-v4-flash';

/**
 * Generic wrapper to call DeepSeek with retry logic for strict JSON output.
 */
async function generateJson<T>(systemPrompt: string, userPrompt: string, retryCount = 1): Promise<T> {
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

        return JSON.parse(content) as T;
    } catch (error: any) {
        if (retryCount > 0) {
            console.warn(`[AI] JSON generation failed, retrying... (${retryCount} left). Error: ${error.message}`);
            return generateJson<T>(
                systemPrompt + "\n\nCRITICAL SYSTEM OVERRIDE: Your previous output was invalid JSON. You MUST return ONLY a strictly valid JSON object. Do not wrap it in markdown code blocks.",
                userPrompt,
                retryCount - 1
            );
        }
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Type Definitions for Blueprints
// ---------------------------------------------------------------------------

export interface DeckBlueprint {
    slides: {
        title: string;
        layout: 'title' | 'title_and_body' | 'two_column';
        bodyText?: string;
        bullets?: string[];
        leftBullets?: string[];
        rightBullets?: string[];
    }[];
}

export interface OnePagerBlueprint {
    project_name: string;
    executive_summary: string;
    problem_statement: string;
    solution: string;
    market_opportunity: string;
    token_utility: string;
    team_or_roadmap: string;
}

export interface FinancialBlueprint {
    token_name: string;
    total_supply: number;
    initial_valuation: number;
    distribution: {
        team: number;
        investors: number;
        community: number;
        treasury: number;
    };
    vesting: {
        team_cliff_months: number;
        investor_cliff_months: number;
    };
}

// ---------------------------------------------------------------------------
// Advanced AI Intelligence Layer
// ---------------------------------------------------------------------------

export async function generateDeckBlueprint(prompt: string): Promise<DeckBlueprint> {
    const systemPrompt = `You are an elite Venture Capital Pitch Deck Architect at a top-tier firm (e.g., a16z, Sequoia).
Your task is to take the user's raw idea and extrapolate it into a deeply compelling, 10-12 slide pitch deck blueprint.
If the user's prompt is short, YOU MUST INVENT highly realistic, sophisticated details (Go-To-Market strategy, market sizing, token utility, technical architecture) to make the deck complete.
Use professional, executive-level language. Avoid hype words; use data-driven, strategic framing.

You MUST structure your response as a strict JSON object exactly like this:
{
  "slides": [
    {
       "title": "EXECUTIVE SUMMARY",
       "layout": "title_and_body",
       "bodyText": "A powerful 2-sentence hook.",
       "bullets": ["Key metric 1", "Key metric 2"]
    },
    {
       "title": "THE PROBLEM",
       "layout": "two_column",
       "leftBullets": ["Pain point 1", "Pain point 2"],
       "rightBullets": ["Market friction", "Inefficiency"]
    }
  ]
}

Available layouts: "title", "title_and_body", "two_column".
Required slides: Title, Problem, Solution, Market Size (TAM/SAM/SOM), Product Architecture, Tokenomics/Value Capture, Go-To-Market, Roadmap, Team.
Output ONLY valid JSON.`;

    return generateJson<DeckBlueprint>(systemPrompt, prompt);
}

export async function generateOnePagerBlueprint(prompt: string): Promise<OnePagerBlueprint> {
    const systemPrompt = `You are a Senior Investment Analyst evaluating a Web3/Tech startup.
Your task is to convert the user's raw notes into a 1-page Investment Memorandum (Executive One-Pager) designed for institutional LPs and VCs.
If the user's notes are sparse, EXTRAPOLATE intelligent, realistic mechanics, market sizes, and strategic advantages to fill out the memo. 
The tone MUST be analytical, objective, and deeply professional.

Structure your JSON exactly like this:
{
  "project_name": "Extract or invent a strong name",
  "executive_summary": "A high-density 1-paragraph summary of the thesis.",
  "problem_statement": "Analytical breakdown of the market inefficiency.",
  "solution": "Technical or strategic explanation of the product.",
  "market_opportunity": "TAM/SAM estimates with realistic figures (e.g., '$45B DeFi Options market').",
  "token_utility": "How the token accrues value (e.g., Buy-and-burn, governance, staking yields).",
  "team_or_roadmap": "Next 12-18 months of technical and growth milestones."
}
Output ONLY valid JSON.`;

    return generateJson<OnePagerBlueprint>(systemPrompt, prompt);
}

export async function generateFinancialBlueprint(prompt: string): Promise<FinancialBlueprint> {
    const systemPrompt = `You are an elite Tokenomics Architect and Quant.
Your task is to convert the user's idea into a realistic, mathematically sound token distribution and vesting model.
If the user does not provide specific numbers, YOU MUST INVENT realistic, industry-standard metrics for a seed-stage Web3 startup.
Standard Web3 parameters: Team (15-20%), Investors (15-25%), Community/Ecosystem (40-50%), Treasury/Liquidity (10-15%). Total must equal 1.0 (100%).
Valuation should be realistic (e.g., $10M - $30M FDV).

Structure your JSON exactly like this:
{
  "token_name": "TKN (extract or invent)",
  "total_supply": 1000000000,
  "initial_valuation": 15000000,
  "distribution": {
    "team": 0.15,
    "investors": 0.20,
    "community": 0.50,
    "treasury": 0.15
  },
  "vesting": {
    "team_cliff_months": 12,
    "investor_cliff_months": 6
  }
}
Output ONLY valid JSON. Ensure distribution values sum to exactly 1.0.`;

    return generateJson<FinancialBlueprint>(systemPrompt, prompt);
}
