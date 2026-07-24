import { Router, Request, Response } from 'express';
import { requirePayment } from '../middleware/x402';
import { generateDeckBlueprint, generateOnePagerBlueprint, generateFinancialBlueprint } from '../services/ai';
import { generatePptx } from '../services/pptEngine';
import { generatePdf } from '../services/pdfEngine';
import { generateXlsx } from '../services/excelEngine';

const router = Router();

// ==========================================
// SERVICE 1: Investor Pitch Deck (1.00 USDT)
// ==========================================
router.post('/deck/generate', requirePayment({ amount: '1.000000' }), async (req: Request, res: Response) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        console.log('[Forma] Calling DeepSeek for PPTX JSON Blueprint...');
        const blueprint = await generateDeckBlueprint(prompt);

        console.log('[Forma] Building native PPTX file...');
        const buffer = await generatePptx(blueprint);

        res.status(200).json({
            status: 'success',
            fileName: 'PitchDeck.pptx',
            // Return base64 for instant delivery
            fileData: buffer.toString('base64'),
            metadata: { slidesGenerated: blueprint.slides.length }
        });
    } catch (error: any) {
        console.error('[Forma] Error generating deck:', error.message);
        res.status(500).json({ error: 'Failed to generate presentation' });
    }
});

// ==========================================
// SERVICE 2: Executive One-Pager (0.05 USDT)
// ==========================================
router.post('/deck/onepager', requirePayment({ amount: '0.050000' }), async (req: Request, res: Response) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

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
// SERVICE 3: Financial Model (0.10 USDT)
// ==========================================
router.post('/deck/financials', requirePayment({ amount: '0.100000' }), async (req: Request, res: Response) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

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
