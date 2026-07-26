import PDFDocument from 'pdfkit';
import { OnePagerBlueprint } from './ai';

export async function generatePdf(blueprint: OnePagerBlueprint): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const theme = blueprint.theme || {
                primary: "#0F172A",
                accent: "#2563EB",
                font_family: "Helvetica",
                base_font_size: 10.5
            };
            
            // Standardize fonts
            const fontRegular = theme.font_family;
            const fontBold = `${theme.font_family}-Bold`;

            const doc = new PDFDocument({
                margin: 50,
                margins: { top: 50, bottom: 70, left: 50, right: 50 },
                size: 'A4',
                info: { Title: `${blueprint.project_name} - Executive Summary`, Author: 'Forma AI' }
            });

            const buffers: Buffer[] = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            let pageCount = 0;

            // Page Added Event: Draw Headers and Footers
            doc.on('pageAdded', () => {
                pageCount++;
                
                // Draw Footer on every page
                const bottom = doc.page.height - 40;
                doc.fontSize(8).font(fontRegular).fillColor('#94A3B8')
                   .text(`Forma AI  ·  Confidential  ·  Page ${pageCount}`, 50, bottom, { align: 'center', lineBreak: false });

                // Draw Header
                if (pageCount === 1) {
                    // Solid Dark Header Block (Page 1)
                    doc.rect(0, 0, doc.page.width, 100).fill(theme.primary);
                    
                    doc.fontSize(22).font(fontBold).fillColor('#FFFFFF')
                       .text(blueprint.project_name.toUpperCase(), 0, 35, { align: 'center', lineBreak: false });
                    
                    doc.fontSize(9).font(fontRegular).fillColor('#93C5FD')
                       .text('CONFIDENTIAL INVESTMENT MEMORANDUM', 0, 65, { align: 'center', characterSpacing: 3, lineBreak: false });
                    
                    // Reset Y for content
                    doc.y = 120;
                    doc.x = 50;
                } else {
                    // Thin subtle top rule for subsequent pages
                    doc.moveTo(50, 40).lineTo(545, 40).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
                    doc.fontSize(8).font(fontRegular).fillColor('#64748B')
                       .text(`${blueprint.project_name.toUpperCase()} - Page ${pageCount}`, 50, 25, { align: 'right', lineBreak: false });
                    
                    // Reset Y for content
                    doc.y = 60;
                    doc.x = 50;
                }
            });

            // Trigger the first page addition manually since it's already added by constructor,
            // but the event doesn't fire for the first page.
            doc.emit('pageAdded');

            // Helper to check space and page break
            const checkSpace = (needed: number) => {
                if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
                    doc.addPage();
                }
            };

            // Custom Native Table Drawer
            const drawTable = (headers: string[], rows: string[][]) => {
                const startX = 50;
                const columnWidth = (545 - 50) / headers.length;
                let currentY = doc.y;

                // Table Header
                checkSpace(30);
                doc.rect(startX, currentY, 545 - 50, 20).fill(theme.primary);
                doc.fillColor('#FFFFFF').font(fontBold).fontSize(theme.base_font_size);
                
                headers.forEach((header, i) => {
                    doc.text(header, startX + (i * columnWidth) + 5, currentY + 5, {
                        width: columnWidth - 10,
                        align: 'left'
                    });
                });
                
                currentY += 20;

                // Table Rows
                doc.font(fontRegular).fontSize(theme.base_font_size);
                rows.forEach((row, rowIndex) => {
                    // Estimate row height (basic implementation, assumes single line)
                    const rowHeight = 20;
                    checkSpace(rowHeight + 10);
                    // update currentY in case of page break
                    if (doc.y > currentY) { currentY = doc.y; }

                    if (rowIndex % 2 === 1) {
                        doc.rect(startX, currentY, 545 - 50, rowHeight).fill('#F8FAFC');
                    }
                    
                    doc.fillColor('#334155');
                    row.forEach((cell, i) => {
                        doc.text(cell, startX + (i * columnWidth) + 5, currentY + 5, {
                            width: columnWidth - 10,
                            align: 'left'
                        });
                    });
                    currentY += rowHeight;
                });
                
                doc.y = currentY + 15;
            };

            // Draw Sections
            if (blueprint.sections && Array.isArray(blueprint.sections)) {
                blueprint.sections.forEach((section) => {
                    checkSpace(80); // Title + some content space
                    
                    // Title
                    doc.fontSize(12).font(fontBold).fillColor(theme.accent)
                       .text(section.title.toUpperCase(), doc.x, doc.y);
                    doc.moveDown(0.5);
                    
                    // Content
                    if (section.type === 'text' && section.content) {
                        doc.fontSize(theme.base_font_size).font(fontRegular).fillColor('#334155').lineGap(6)
                           .text(section.content, { align: 'justify' });
                        doc.moveDown(1.5);
                    } else if (section.type === 'table' && section.table) {
                        drawTable(section.table.headers, section.table.rows);
                        doc.moveDown(1);
                    }
                });
            }

            doc.end();
        } catch (error: any) {
            console.error('[Engine] PDF Generation Error:', error.message);
            reject(new Error('PDF generation failed'));
        }
    });
}
