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
    { path: '/api/deck/generate', price: '$1.00', desc: 'Investor Pitch Deck' },
    { path: '/api/deck/onepager', price: '$0.05', desc: 'Executive One-Pager' },
    { path: '/api/deck/financials', price: '$0.10', desc: 'Financial Model' }
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

// Interceptor to duplicate PAYMENT-REQUIRED header into the JSON body for OKX scanners
router.use((req: Request, res: Response, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
        if (res.statusCode === 402) {
            const paymentHeader = res.getHeader('PAYMENT-REQUIRED');
            if (paymentHeader && typeof paymentHeader === 'string') {
                try {
                    const decoded = Buffer.from(paymentHeader, 'base64').toString('utf8');
                    const challenge = JSON.parse(decoded);
                    if (!body || Object.keys(body).length === 0) {
                        return originalJson(challenge);
                    }
                } catch (e) {
                    console.error("[Forma] Failed to decode PAYMENT-REQUIRED header", e);
                }
            }
        }
        return originalJson(body);
    };
    next();
});

router.use(paymentMiddleware(paymentConfig, resourceServer));

// ==========================================
// SERVICE 1: Investor Pitch Deck
// ==========================================
router.post('/deck/generate', async (req: Request, res: Response) => {
    try {
        let prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
        
        if (req.body.context) {
            prompt += `\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${req.body.context}`;
        }

        console.log('[Forma] Calling DeepSeek for PPTX JSON Blueprint...');
        const blueprint = await generateDeckBlueprint(prompt);

        console.log('[Forma] Building native PPTX file...');
        const buffer = await generatePptx(blueprint);

        res.status(200).json({
            status: 'success',
            fileName: 'PitchDeck.pptx',
            fileData: buffer.toString('base64'),
            metadata: { slidesGenerated: blueprint.slides.length }
        });
    } catch (error: any) {
        console.error('[Forma] Error generating deck:', error.message);
        res.status(500).json({ error: 'Failed to generate presentation' });
    }
});

// ==========================================
// SERVICE 2: Executive One-Pager
// ==========================================
router.post('/deck/onepager', async (req: Request, res: Response) => {
    try {
        let prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        if (req.body.context) {
            prompt += `\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${req.body.context}`;
        }

        console.log('[Forma] Calling DeepSeek for PDF JSON Blueprint...');
        const blueprint = await generateOnePagerBlueprint(prompt);

        console.log('[Forma] Building native PDF file...');
        const buffer = await generatePdf(blueprint);

        res.status(200).json({
            status: 'success',
            fileName: 'Executive_Summary.pdf',
            fileData: buffer.toString('base64'),
            metadata: { projectName: blueprint.project_name }
        });
    } catch (error: any) {
        console.error('[Forma] Error generating one-pager:', error.message);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// ==========================================
// SERVICE 3: Financial Model
// ==========================================
router.post('/deck/financials', async (req: Request, res: Response) => {
    try {
        let prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        if (req.body.context) {
            prompt += `\n\nADDITIONAL CONTEXT PROVIDED BY USER:\n${req.body.context}`;
        }

        console.log('[Forma] Calling DeepSeek for Excel JSON Blueprint...');
        const blueprint = await generateFinancialBlueprint(prompt);

        console.log('[Forma] Building native Excel file with formulas...');
        const buffer = await generateXlsx(blueprint);

        res.status(200).json({
            status: 'success',
            fileName: 'Tokenomics_Model.xlsx',
            fileData: buffer.toString('base64'),
            metadata: { tokenName: blueprint.token_name, supply: blueprint.total_supply }
        });
    } catch (error: any) {
        console.error('[Forma] Error generating financials:', error.message);
        res.status(500).json({ error: 'Failed to generate Excel model' });
    }
});

export default router;
