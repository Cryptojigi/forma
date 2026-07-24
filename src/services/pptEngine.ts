import pptxgen from "pptxgenjs";
import { DeckBlueprint } from "./ai";

export async function generatePptx(blueprint: DeckBlueprint): Promise<Buffer> {
    const pres = new pptxgen();
    
    // Set presentation properties
    pres.author = 'Forma Agent';
    pres.company = 'Forma';
    pres.title = 'Investor Pitch Deck';

    // Define a premium dark Web3 aesthetic layout
    pres.layout = 'LAYOUT_16x9';

    // Define slide masters (The "Design" part of the separation)
    pres.defineSlideMaster({
        title: 'MASTER_DARK',
        background: { color: '0F172A' }, // Tailwind slate-900
        objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: '3B82F6' } } }, // Top blue accent
            { text: { text: 'CONFIDENTIAL', options: { x: '90%', y: '95%', fontSize: 8, color: '64748B' } } }
        ]
    });

    // Create slides based on JSON blueprint
    for (const slideData of blueprint.slides) {
        const slide = pres.addSlide({ masterName: 'MASTER_DARK' });
        
        // Add Title (common to all slides)
        slide.addText(slideData.title.toUpperCase(), {
            x: 0.5,
            y: 0.6,
            w: '90%',
            h: 0.8,
            fontSize: 28,
            color: 'F8FAFC',
            bold: true,
            fontFace: 'Arial' // Native font
        });

        // Add content based on layout hint from AI
        if (slideData.layout === 'title') {
            if (slideData.bodyText) {
                slide.addText(slideData.bodyText, {
                    x: 0.5,
                    y: 2.0,
                    w: '90%',
                    fontSize: 18,
                    color: '94A3B8',
                    italic: true
                });
            }
        } else if (slideData.layout === 'two_column') {
            if (slideData.leftBullets) {
                slide.addText(slideData.leftBullets.map(b => ({ text: b })), {
                    x: 0.5, y: 1.8, w: '40%', h: '60%',
                    fontSize: 14, color: 'CBD5E1', bullet: true, lineSpacing: 30
                });
            }
            if (slideData.rightBullets) {
                slide.addText(slideData.rightBullets.map(b => ({ text: b })), {
                    x: 5.5, y: 1.8, w: '40%', h: '60%',
                    fontSize: 14, color: 'CBD5E1', bullet: true, lineSpacing: 30
                });
            }
        } else {
            // Default: title_and_body
            if (slideData.bodyText) {
                slide.addText(slideData.bodyText, {
                    x: 0.5, y: 1.5, w: '90%', fontSize: 16, color: '94A3B8'
                });
            }
            if (slideData.bullets) {
                slide.addText(slideData.bullets.map(b => ({ text: b })), {
                    x: 0.5, y: 2.2, w: '90%', h: '50%',
                    fontSize: 15, color: 'CBD5E1', bullet: true, lineSpacing: 35
                });
            }
        }
    }

    // Generate in-memory buffer
    return await pres.write({ outputType: 'nodebuffer' }) as Buffer;
}
