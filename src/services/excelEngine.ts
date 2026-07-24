import ExcelJS from 'exceljs';
import { FinancialBlueprint } from './ai';

export async function generateXlsx(blueprint: FinancialBlueprint): Promise<Buffer> {
    try {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Forma AI';

        // ==========================================
        // SHEET 1: Dashboard & Inputs
        // ==========================================
        const dashSheet = workbook.addWorksheet('Dashboard');
        
        // Style column widths
        dashSheet.columns = [
            { width: 30 }, { width: 20 }, { width: 20 }
        ];

        // Headers
        dashSheet.mergeCells('A1:C1');
        const titleCell = dashSheet.getCell('A1');
        titleCell.value = `${blueprint.token_name.toUpperCase()} - TOKENOMICS MODEL`;
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        titleCell.alignment = { horizontal: 'center' };

        // Inputs Section (The "Design" part of Excel)
        dashSheet.getCell('A3').value = 'Key Inputs';
        dashSheet.getCell('A3').font = { bold: true, color: { argb: 'FF3B82F6' } };
        
        dashSheet.getCell('A4').value = 'Total Supply';
        dashSheet.getCell('B4').value = blueprint.total_supply;
        dashSheet.getCell('B4').numFmt = '#,##0';

        dashSheet.getCell('A5').value = 'Initial Valuation ($)';
        dashSheet.getCell('B5').value = blueprint.initial_valuation;
        dashSheet.getCell('B5').numFmt = '$#,##0';

        // Allocation Breakdown
        dashSheet.getCell('A8').value = 'Allocation Breakdown';
        dashSheet.getCell('A8').font = { bold: true, color: { argb: 'FF3B82F6' } };
        
        const allocations = [
            ['Team', blueprint.distribution.team],
            ['Investors', blueprint.distribution.investors],
            ['Community', blueprint.distribution.community],
            ['Treasury', blueprint.distribution.treasury]
        ];

        let row = 9;
        for (const [name, pct] of allocations) {
            dashSheet.getCell(`A${row}`).value = name;
            
            // Input percentage
            const pctCell = dashSheet.getCell(`B${row}`);
            pctCell.value = pct;
            pctCell.numFmt = '0.0%';
            
            // Active Formula: Tokens = Total Supply * Percentage
            const tokenCell = dashSheet.getCell(`C${row}`);
            tokenCell.value = { formula: `B${row}*B4`, date1904: false };
            tokenCell.numFmt = '#,##0';
            
            row++;
        }

        // ==========================================
        // SHEET 2: Vesting Schedule
        // ==========================================
        const vestSheet = workbook.addWorksheet('Vesting Schedule');
        vestSheet.columns = [
            { header: 'Month', key: 'month', width: 10 },
            { header: 'Team Unlock', key: 'team', width: 20 },
            { header: 'Investor Unlock', key: 'investor', width: 20 }
        ];

        // Header styling
        vestSheet.getRow(1).font = { bold: true };
        vestSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        vestSheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

        const teamTotalFormula = `Dashboard!C9`;
        const invTotalFormula = `Dashboard!C10`;
        const teamCliff = blueprint.vesting.team_cliff_months;
        const invCliff = blueprint.vesting.investor_cliff_months;

        // Generate 36 months of vesting
        for (let m = 1; m <= 36; m++) {
            // Active Formulas for linear unlock after cliff
            const teamUnlock = m > teamCliff ? { formula: `IF(${m} > ${teamCliff}, ${teamTotalFormula} / (36 - ${teamCliff}), 0)`, date1904: false } : 0;
            const invUnlock = m > invCliff ? { formula: `IF(${m} > ${invCliff}, ${invTotalFormula} / (36 - ${invCliff}), 0)`, date1904: false } : 0;

            vestSheet.addRow({
                month: m,
                team: teamUnlock,
                investor: invUnlock
            });
        }

        // Number formatting for vesting sheet
        vestSheet.getColumn('B').numFmt = '#,##0';
        vestSheet.getColumn('C').numFmt = '#,##0';

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    } catch (error: any) {
        console.error('[Engine] Excel Generation Error:', error.message);
        throw new Error('Excel generation failed');
    }
}
