import { Router, Request, Response } from 'express';
import { generateDeckBlueprint, generateOnePagerBlueprint, generateFinancialBlueprint } from '../services/ai';
import { generatePptx } from '../services/pptEngine';
import { generatePdf } from '../services/pdfEngine';
import { generateXlsx } from '../services/excelEngine';
import { paymentMiddleware, x402ResourceServer } from '@okxweb3/x402-express';
import { ExactEvmScheme } from '@okxweb3/x402-evm/exact/server';
import { OKXFacilitatorClient } from '@okxweb3/x402-core';

const router = Router();
const CHAIN_ID = process.env.CHAIN_ID || '196';
const NETWORK = `eip155:${CHAIN_ID}`;
const RECEIVING_WALLET = process.env.RECEIVING_WALLET_ADDRESS || '0x';

// Setup Facilitator
const facilitatorClient = new OKXFacilitatorClient({
    apiKey: process.env.OKX_API_KEY || '',
    secretKey: process.env.OKX_SECRET_KEY || '',
    passphrase: process.env.OKX_PASSPHRASE || '',
});

// Setup Resource Server
const resourceServer = new x402ResourceServer(facilitatorClient);
resourceServer.register(NETWORK as `${string}:${string}`, new ExactEvmScheme());

const paymentConfig: Record<string, any> = {};

const endpoints = [
    { path: '/api/deck/generate', price: '$1.00', desc: 'Investor Pitch Deck', mcpName: 'generate_deck' },
    { path: '/api/deck/onepager', price: '$0.05', desc: 'Executive One-Pager', mcpName: 'generate_onepager' },
    { path: '/api/deck/financials', price: '$0.10', desc: 'Financial Model', mcpName: 'generate_financials' }
];

endpoints.forEach(({ path, price, desc }) => {
    const config = {
        accepts: [{ scheme: "exact", network: NETWORK, payTo: RECEIVING_WALLET, price }],
        description: desc,
        mimeType: "application/json"
    };
    
    // Register for both GET (for OKX scanner) and POST (for actual usage)
    paymentConfig[`GET ${path}`] = config;
    paymentConfig[`POST ${path}`] = config;
    
    // Also map without /api in case the middleware uses router-relative paths
    const relativePath = path.replace('/api', '');
    paymentConfig[`GET ${relativePath}`] = config;
    paymentConfig[`POST ${relativePath}`] = config;
});

// ==========================================
// CORE GENERATION CONTROLLERS
// ==========================================
async function processDeckGenerate(prompt: string, context?: string) {
    if (!prompt) throw new Error('Prompt is required');
    let fullPrompt = context ? `${prompt}\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${context}` : prompt;
    console.log('[Forma] Calling DeepSeek for PPTX JSON Blueprint...');
    const blueprint = await generateDeckBlueprint(fullPrompt);
    console.log('[Forma] Building native PPTX file...');
    const buffer = await generatePptx(blueprint);
    return { fileName: 'PitchDeck.pptx', fileData: buffer.toString('base64'), metadata: { slidesGenerated: blueprint.slides.length } };
}

async function processOnePager(prompt: string, context?: string) {
    if (!prompt) throw new Error('Prompt is required');
    let fullPrompt = context ? `${prompt}\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${context}` : prompt;
    console.log('[Forma] Calling DeepSeek for PDF JSON Blueprint...');
    const blueprint = await generateOnePagerBlueprint(fullPrompt);
    console.log('[Forma] Building native PDF file...');
    const buffer = await generatePdf(blueprint);
    return { fileName: 'Executive_Summary.pdf', fileData: buffer.toString('base64'), metadata: { projectName: blueprint.project_name } };
}

async function processFinancials(prompt: string, context?: string) {
    if (!prompt) throw new Error('Prompt is required');
    let fullPrompt = context ? `${prompt}\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${context}` : prompt;
    console.log('[Forma] Calling DeepSeek for Excel JSON Blueprint...');
    const blueprint = await generateFinancialBlueprint(fullPrompt);
    console.log('[Forma] Building native Excel file with formulas...');
    const buffer = await generateXlsx(blueprint);
    return { fileName: 'Tokenomics_Model.xlsx', fileData: buffer.toString('base64'), metadata: { tokenName: blueprint.token_name, supply: blueprint.total_supply } };
}

// ==========================================
// MCP ENDPOINT (Bypasses global REST middleware for discovery)
// ==========================================
router.post('/mcp', (req: Request, res: Response, next) => {
    const { method, params, id } = req.body;
    
    if (method === 'initialize') {
        return res.json({
            jsonrpc: "2.0",
            id,
            result: {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: { name: "Forma", version: "1.0.0" }
            }
        });
    }
    
    if (method === 'tools/list') {
        return res.json({
            jsonrpc: "2.0",
            id,
            result: {
                tools: [
                    { name: "generate_deck", description: "Investor Pitch Deck ($1.00)", inputSchema: { type: "object", properties: { prompt: { type: "string", description: "The topic or prompt for the pitch deck" } }, required: ["prompt"] } },
                    { name: "generate_onepager", description: "Executive One-Pager ($0.05)", inputSchema: { type: "object", properties: { prompt: { type: "string", description: "The core business idea" } }, required: ["prompt"] } },
                    { name: "generate_financials", description: "Financial Model ($0.10)", inputSchema: { type: "object", properties: { prompt: { type: "string", description: "The tokenomics or revenue model idea" } }, required: ["prompt"] } }
                ]
            }
        });
    }
    
    if (method === 'tools/call') {
        const toolName = params?.name;
        const prompt = params?.arguments?.prompt;
        
        let endpointDef = endpoints.find(e => e.mcpName === toolName);
        if (!endpointDef) {
            return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Tool not found" } });
        }
        
        // Dynamically invoke the payment middleware for this specific tool request
        const dynamicPaymentConfig = {
            'POST /mcp': paymentConfig[`POST ${endpointDef.path}`] 
        };
        
        const mcpPaymentMiddleware = paymentMiddleware(dynamicPaymentConfig, resourceServer);
        
        // Run the OKX middleware
        return mcpPaymentMiddleware(req, res, async (err: any) => {
            if (err) return next(err);
            
            // Payment verified! Now generate the asset natively
            try {
                let result;
                if (toolName === 'generate_deck') result = await processDeckGenerate(prompt);
                else if (toolName === 'generate_onepager') result = await processOnePager(prompt);
                else if (toolName === 'generate_financials') result = await processFinancials(prompt);
                
                // Return native JSON-RPC format
                return res.json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [
                            { type: "text", text: `Asset Generated Successfully!\nFilename: ${result?.fileName}\n\nBase64 Data:\n${result?.fileData}` }
                        ]
                    }
                });
            } catch (error: any) {
                console.error("[Forma MCP Error]", error);
                return res.json({ jsonrpc: "2.0", id, error: { code: -32000, message: error.message } });
            }
        });
    }
    
    // Not an MCP method we handle
    return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
});

// ==========================================
// GLOBAL PAYMENT MIDDLEWARE (For standard REST APIs)
// ==========================================
router.use(paymentMiddleware(paymentConfig, resourceServer));

// ==========================================
// SERVICE 1: Investor Pitch Deck (REST)
// ==========================================
router.post('/deck/generate', async (req: Request, res: Response) => {
    try {
        const result = await processDeckGenerate(req.body.prompt, req.body.context);
        res.status(200).json({ status: 'success', ...result });
    } catch (e: any) {
        res.status(e.message === 'Prompt is required' ? 400 : 500).json({ error: e.message || 'Failed to generate presentation' });
    }
});

// ==========================================
// SERVICE 2: Executive One-Pager (REST)
// ==========================================
router.post('/deck/onepager', async (req: Request, res: Response) => {
    try {
        const result = await processOnePager(req.body.prompt, req.body.context);
        res.status(200).json({ status: 'success', ...result });
    } catch (e: any) {
        res.status(e.message === 'Prompt is required' ? 400 : 500).json({ error: e.message || 'Failed to generate PDF' });
    }
});

// ==========================================
// SERVICE 3: Financial Model (REST)
// ==========================================
router.post('/deck/financials', async (req: Request, res: Response) => {
    try {
        const result = await processFinancials(req.body.prompt, req.body.context);
        res.status(200).json({ status: 'success', ...result });
    } catch (e: any) {
        res.status(e.message === 'Prompt is required' ? 400 : 500).json({ error: e.message || 'Failed to generate Excel model' });
    }
});

export default router;
