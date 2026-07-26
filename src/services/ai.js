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
exports.FinancialBlueprintSchema = exports.OnePagerBlueprintSchema = exports.ThemeSchema = exports.DeckBlueprintSchema = void 0;
exports.generateDeckBlueprint = generateDeckBlueprint;
exports.generateOnePagerBlueprint = generateOnePagerBlueprint;
exports.generateFinancialBlueprint = generateFinancialBlueprint;
var openai_1 = require("openai");
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
var prompts_1 = require("./prompts");
dotenv_1.default.config();
// Create OpenAI client configured for DeepSeek API
var openai = new openai_1.default({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});
var MODEL = 'deepseek-v4-flash';
/**
 * Generic wrapper to call DeepSeek with retry logic for strict JSON output and Zod validation.
 */
function generateJson(systemPrompt_1, userPrompt_1, schema_1) {
    return __awaiter(this, arguments, void 0, function (systemPrompt, userPrompt, schema, retryCount) {
        var response, content, parsed, error_1;
        var _a, _b;
        if (retryCount === void 0) { retryCount = 2; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, openai.chat.completions.create({
                            model: MODEL,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            response_format: { type: 'json_object' },
                            temperature: 0.2, // Low temperature for deterministic, highly structural output
                        })];
                case 1:
                    response = _c.sent();
                    content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                    if (!content)
                        throw new Error('Empty response from AI');
                    parsed = JSON.parse(content);
                    // Zod Runtime Validation
                    return [2 /*return*/, schema.parse(parsed)];
                case 2:
                    error_1 = _c.sent();
                    if (retryCount > 0) {
                        console.warn("[AI] JSON generation or validation failed, retrying... (".concat(retryCount, " left). Error: ").concat(error_1.message));
                        return [2 /*return*/, generateJson(systemPrompt + "\n\nCRITICAL SYSTEM OVERRIDE: Your previous output failed validation. You MUST return ONLY a strictly valid JSON object matching the exact schema. Error details: ".concat(error_1.message), userPrompt, schema, retryCount - 1)];
                    }
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// ---------------------------------------------------------------------------
// Zod Schemas & Types
// ---------------------------------------------------------------------------
exports.DeckBlueprintSchema = zod_1.z.object({
    slides: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        layout: zod_1.z.enum(['title', 'title_and_body', 'two_column']),
        bodyText: zod_1.z.string().optional(),
        bullets: zod_1.z.array(zod_1.z.string()).optional(),
        leftBullets: zod_1.z.array(zod_1.z.string()).optional(),
        rightBullets: zod_1.z.array(zod_1.z.string()).optional(),
    }))
});
exports.ThemeSchema = zod_1.z.object({
    primary: zod_1.z.string().optional(),
    accent: zod_1.z.string().optional(),
    font_family: zod_1.z.enum(['Helvetica', 'Times-Roman', 'Courier']).optional(),
    base_font_size: zod_1.z.number().optional()
});
exports.OnePagerBlueprintSchema = zod_1.z.object({
    project_name: zod_1.z.string(),
    theme: exports.ThemeSchema.optional(),
    sections: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        type: zod_1.z.enum(['text', 'table']),
        content: zod_1.z.string().optional(),
        table: zod_1.z.object({
            headers: zod_1.z.array(zod_1.z.string()),
            rows: zod_1.z.array(zod_1.z.array(zod_1.z.string()))
        }).optional()
    }))
});
exports.FinancialBlueprintSchema = zod_1.z.object({
    token_name: zod_1.z.string(),
    total_supply: zod_1.z.number(),
    initial_valuation: zod_1.z.number(),
    distribution: zod_1.z.object({
        team: zod_1.z.number(),
        investors: zod_1.z.number(),
        community: zod_1.z.number(),
        treasury: zod_1.z.number(),
    }),
    vesting: zod_1.z.object({
        team_cliff_months: zod_1.z.number(),
        investor_cliff_months: zod_1.z.number(),
    })
});
// ---------------------------------------------------------------------------
// Advanced AI Intelligence Layer
// ---------------------------------------------------------------------------
function generateDeckBlueprint(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, generateJson(prompts_1.DECK_SYSTEM_PROMPT, prompt, exports.DeckBlueprintSchema)];
        });
    });
}
function generateOnePagerBlueprint(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, generateJson(prompts_1.ONEPAGER_SYSTEM_PROMPT, prompt, exports.OnePagerBlueprintSchema)];
        });
    });
}
function generateFinancialBlueprint(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, generateJson(prompts_1.FINANCIAL_SYSTEM_PROMPT, prompt, exports.FinancialBlueprintSchema)];
        });
    });
}
