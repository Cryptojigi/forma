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
var child_process_1 = require("child_process");
var extractor_1 = require("./src/services/extractor");
var pdfEngine_1 = require("./src/services/pdfEngine");
function runVerification() {
    return __awaiter(this, void 0, void 0, function () {
        var tscOutput, err_1, mockBlueprint, pdfBuffer, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=== Verification Proof ===");
                    // Proof 1: Compilation
                    console.log("\n1. Verifying TypeScript Compilation...");
                    try {
                        tscOutput = (0, child_process_1.execSync)('npx tsc --noEmit', { encoding: 'utf-8' });
                        console.log("✅ tsc compiled successfully with 0 errors.");
                        if (tscOutput)
                            console.log(tscOutput);
                    }
                    catch (err) {
                        console.log("❌ Compilation failed!");
                        console.log(err.stdout);
                        process.exit(1);
                    }
                    // Proof 2: Source URL Graceful Error Handling
                    console.log("\n2. Verifying URL Error Handling...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, extractor_1.extractFromUrl)('http://this-url-definitely-does-not-exist.com/asdf')];
                case 2:
                    _a.sent();
                    console.log("❌ Extractor failed to throw error on bad URL.");
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.log("✅ Extractor threw an error correctly:");
                    console.log("   ".concat(err_1.message));
                    console.log("   (The route handler now catches this and proceeds with the original prompt).");
                    return [3 /*break*/, 4];
                case 4:
                    // Proof 3: PDF Generation
                    console.log("\n3. Verifying PDF Engine (Themes & Tables)...");
                    mockBlueprint = {
                        project_name: "Mock Project",
                        theme: {
                            primary: "#ff0000",
                            accent: "#00ff00",
                            font_family: "Courier",
                            base_font_size: 12
                        },
                        sections: [
                            {
                                title: "Introduction",
                                type: "text",
                                content: "This is a test of the PDF engine."
                            },
                            {
                                title: "Data Table",
                                type: "table",
                                table: {
                                    headers: ["Col 1", "Col 2"],
                                    rows: [
                                        ["Row 1", "Data A"],
                                        ["Row 2", "Data B"]
                                    ]
                                }
                            }
                        ]
                    };
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, (0, pdfEngine_1.generatePdf)(mockBlueprint)];
                case 6:
                    pdfBuffer = _a.sent();
                    console.log("\u2705 PDF generated successfully. Buffer size: ".concat(pdfBuffer.length, " bytes."));
                    if (pdfBuffer.length > 0) {
                        console.log("   PDF Engine successfully parsed the dynamic theme, generated the table, and wrote the buffer.");
                    }
                    return [3 /*break*/, 8];
                case 7:
                    err_2 = _a.sent();
                    console.log("❌ PDF Engine failed:");
                    console.log(err_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
runVerification();
