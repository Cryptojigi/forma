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

// Define X402 Payment Pricing
const paymentConfig: Record<string, any> = {
    "POST /api/deck/generate": {
        accepts: [{ scheme: "exact", network: NETWORK, payTo: RECEIVING_WALLET, price: "$1.00" }],
        description: "Investor Pitch Deck",
        mimeType: "application/json"
    },
    "POST /api/deck/onepager": {
        accepts: [{ scheme: "exact", network: NETWORK, payTo: RECEIVING_WALLET, price: "$0.05" }],
        description: "Executive One-Pager",
        mimeType: "application/json"
    },
    "POST /api/deck/financials": {
        accepts: [{ scheme: "exact", network: NETWORK, payTo: RECEIVING_WALLET, price: "$0.10" }],
        description: "Financial Model",
        mimeType: "application/json"
    }
};

// Also map without /api in case the middleware looks at router-relative paths
paymentConfig["POST /deck/generate"] = paymentConfig["POST /api/deck/generate"];
paymentConfig["POST /deck/onepager"] = paymentConfig["POST /api/deck/onepager"];
paymentConfig["POST /deck/financials"] = paymentConfig["POST /api/deck/financials"];

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
