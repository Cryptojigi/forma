"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePdf = generatePdf;
var pdfkit_table_1 = require("pdfkit-table");
function generatePdf(blueprint) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var doc_1, PRIMARY_1, ACCENT, FONT_FAMILY_1, BASE_FONT_1, TEXT_LIGHT, TEXT_MUTED_1, TEXT_BODY_1, DIVIDER, HEADER_HEIGHT, buffers_1, pageNumber_1, MINIMUM_SECTION_SPACE, i, section, isFirst, remainingSpace, titleY, footerY, error_1;
                    var _a, _b, _c, _d;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                _e.trys.push([0, 6, , 7]);
                                doc_1 = new pdfkit_table_1.default({
                                    margins: { top: 50, bottom: 60, left: 50, right: 50 },
                                    size: 'A4',
                                    info: { Title: "".concat(blueprint.project_name, " - Executive Summary"), Author: 'Forma' }
                                });
                                PRIMARY_1 = ((_a = blueprint.theme) === null || _a === void 0 ? void 0 : _a.primary) || '#0F172A';
                                ACCENT = ((_b = blueprint.theme) === null || _b === void 0 ? void 0 : _b.accent) || '#2563EB';
                                FONT_FAMILY_1 = ((_c = blueprint.theme) === null || _c === void 0 ? void 0 : _c.font_family) || 'Helvetica';
                                BASE_FONT_1 = ((_d = blueprint.theme) === null || _d === void 0 ? void 0 : _d.base_font_size) || 10.5;
                                TEXT_LIGHT = '#F8FAFC';
                                TEXT_MUTED_1 = '#94A3B8';
                                TEXT_BODY_1 = '#334155';
                                DIVIDER = '#E2E8F0';
                                HEADER_HEIGHT = 100;
                                buffers_1 = [];
                                doc_1.on('data', buffers_1.push.bind(buffers_1));
                                doc_1.on('end', function () { return resolve(Buffer.concat(buffers_1)); });
                                doc_1.on('error', reject);
                                pageNumber_1 = 1;
                                // Setup pageAdded listener for differential headers & unbranded footer
                                doc_1.on('pageAdded', function () {
                                    pageNumber_1++;
                                    // Page 2+ header (Thin Bar)
                                    doc_1.rect(0, 0, doc_1.page.width, 25).fill(PRIMARY_1);
                                    doc_1.fontSize(8).font(FONT_FAMILY_1).fillColor(TEXT_MUTED_1)
                                        .text("".concat(blueprint.project_name, "           Page ").concat(pageNumber_1), 50, 10, { align: 'right' });
                                    doc_1.y = 45; // Start content below the thin header
                                    // Draw footer for page 2+
                                    var footerY = doc_1.page.height - 35;
                                    doc_1.fontSize(7.5).font(FONT_FAMILY_1).fillColor(TEXT_MUTED_1)
                                        .text("Confidential  \u00B7  Page ".concat(pageNumber_1), 50, footerY, { align: 'center' });
                                });
                                // Page 1 Full Header Block
                                doc_1.rect(0, 0, doc_1.page.width, HEADER_HEIGHT).fill(PRIMARY_1);
                                // Name
                                doc_1.fontSize(BASE_FONT_1 * 2.1).font("".concat(FONT_FAMILY_1, "-Bold")).fillColor(TEXT_LIGHT)
                                    .text(blueprint.project_name.toUpperCase(), 0, 30, { align: 'center', width: doc_1.page.width });
                                // Subtitle
                                doc_1.fontSize(BASE_FONT_1 * 0.85).font(FONT_FAMILY_1).fillColor(TEXT_MUTED_1)
                                    .text('CONFIDENTIAL INVESTMENT MEMORANDUM', 0, doc_1.y + 5, { align: 'center', characterSpacing: 2, width: doc_1.page.width });
                                doc_1.y = HEADER_HEIGHT + 20;
                                MINIMUM_SECTION_SPACE = 120;
                                i = 0;
                                _e.label = 1;
                            case 1:
                                if (!(i < blueprint.sections.length)) return [3 /*break*/, 5];
                                section = blueprint.sections[i];
                                isFirst = (i === 0);
                                remainingSpace = doc_1.page.height - doc_1.y - 60;
                                if (remainingSpace < MINIMUM_SECTION_SPACE) {
                                    doc_1.addPage();
                                }
                                // Divider (except first section)
                                if (!isFirst) {
                                    doc_1.moveTo(50, doc_1.y).lineTo(545, doc_1.y).lineWidth(0.5).strokeColor(DIVIDER).stroke();
                                    doc_1.moveDown(1.2);
                                }
                                titleY = doc_1.y;
                                doc_1.rect(50, titleY, 2, 12).fill(ACCENT);
                                // Section Title
                                doc_1.fontSize(BASE_FONT_1 * 1.15).font("".concat(FONT_FAMILY_1, "-Bold")).fillColor(ACCENT)
                                    .text(section.title.toUpperCase(), 58, titleY);
                                doc_1.moveDown(0.5);
                                if (!(section.type === 'text' && section.content)) return [3 /*break*/, 2];
                                doc_1.fontSize(BASE_FONT_1).font(FONT_FAMILY_1).fillColor(TEXT_BODY_1).lineGap(6)
                                    .text(section.content, 50, undefined, { align: 'justify', width: 495 });
                                doc_1.moveDown(1.8);
                                return [3 /*break*/, 4];
                            case 2:
                                if (!(section.type === 'table' && section.table)) return [3 /*break*/, 4];
                                // Wait for the table to finish rendering
                                return [4 /*yield*/, doc_1.table({
                                        headers: section.table.headers,
                                        rows: section.table.rows
                                    }, {
                                        prepareHeader: function () { return doc_1.font("".concat(FONT_FAMILY_1, "-Bold")).fontSize(BASE_FONT_1 * 0.9).fillColor(TEXT_BODY_1); },
                                        prepareRow: function () { return doc_1.font(FONT_FAMILY_1).fontSize(BASE_FONT_1 * 0.9).fillColor(TEXT_BODY_1); },
                                        divider: {
                                            header: { disabled: false, width: 1, opacity: 1 },
                                            horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
                                        },
                                        padding: 5
                                    })];
                            case 3:
                                // Wait for the table to finish rendering
                                _e.sent();
                                doc_1.moveDown(1.8);
                                _e.label = 4;
                            case 4:
                                i++;
                                return [3 /*break*/, 1];
                            case 5:
                                footerY = doc_1.page.height - 35;
                                doc_1.fontSize(7.5).font(FONT_FAMILY_1).fillColor(TEXT_MUTED_1)
                                    .text('Confidential  ·  Page 1', 50, footerY, { align: 'center' });
                                doc_1.end();
                                return [3 /*break*/, 7];
                            case 6:
                                error_1 = _e.sent();
                                console.error('[Engine] PDF Generation Error:', error_1.message);
                                reject(new Error('PDF generation failed'));
                                return [3 /*break*/, 7];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
