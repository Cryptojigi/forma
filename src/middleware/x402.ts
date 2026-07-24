/**
 * x402 Payment Middleware — OKX Native
 *
 * Implements the OKX x402 payment protocol for Aegis's paid endpoints.
 * Returns HTTP 402 with the standard accepts[] challenge format,
 * and verifies EIP-3009 signatures on replay.
 */

import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaymentConfig {
    amount: number;
    asset?: string;
}

interface PaymentChallenge {
    x402Version: number;
    resource: {
        url: string;
        description: string;
    };
    accepts: Array<{
        scheme: string;
        network: string;
        asset: string;
        amount: string;
        payTo: string;
        decimals?: number;
    }>;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RECEIVING_WALLET = process.env.RECEIVING_WALLET_ADDRESS || '';
const RECEIVING_WALLET_LC = RECEIVING_WALLET.toLowerCase();
const ADMIN_BYPASS_KEY = process.env.ADMIN_BYPASS_KEY || '';
const USDT_XLAYER = process.env.USDT_CONTRACT_ADDRESS || '0x779ded0c9e1022225f8e0630b35a9b54be713736';
const CHAIN_ID = process.env.CHAIN_ID || '196';
const USDT_DECIMALS = 6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBaseUnits(amount: number): string {
    const base = BigInt(Math.round(amount * 10 ** USDT_DECIMALS));
    return base.toString();
}

// ---------------------------------------------------------------------------
// EIP-712 / EIP-3009 Domain & Types
// ---------------------------------------------------------------------------

const EIP712_DOMAINS = [
    { name: 'USD₮0', version: '1', chainId: Number(CHAIN_ID), verifyingContract: USDT_XLAYER },
    { name: 'USDT0', version: '1', chainId: Number(CHAIN_ID), verifyingContract: USDT_XLAYER },
    { name: 'Tether USD', version: '1', chainId: Number(CHAIN_ID), verifyingContract: USDT_XLAYER },
    { name: 'USDT', version: '1', chainId: Number(CHAIN_ID), verifyingContract: USDT_XLAYER },
    { name: 'Tether USD', version: '2', chainId: Number(CHAIN_ID), verifyingContract: USDT_XLAYER },
];

const eip712TypesList = [
    {
        TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
        ]
    },
    {
        TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
        ]
    }
];

function buildChallenge(amount: number): PaymentChallenge {
    return {
        x402Version: 2,
        resource: {
            url: "https://aegis-dzyd.onrender.com",
            description: "Aegis AI Smart Contract Audit and Guardrails"
        },
        accepts: [
            {
                scheme: 'exact',
                network: `eip155:${CHAIN_ID}`,
                asset: USDT_XLAYER,
                amount: toBaseUnits(amount),
                payTo: RECEIVING_WALLET,
                decimals: USDT_DECIMALS,
            },
        ],
    };
}

// ---------------------------------------------------------------------------
// Header Parsing — Try multiple formats
// ---------------------------------------------------------------------------

function tryParsePaymentHeader(raw: string): any | null {
    const trimmed = raw.trim();

    // 1. Try raw JSON first
    try {
        return JSON.parse(trimmed);
    } catch {}

    // 2. Strip scheme prefix: "x402 {...}" or "payment:{...}"
    for (const prefix of ['x402 ', 'payment:', 'payment ']) {
        if (trimmed.toLowerCase().startsWith(prefix)) {
            try {
                return JSON.parse(trimmed.slice(prefix.length).trim());
            } catch {}
        }
    }

    // 3. Try base64 decode
    try {
        const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch {}

    // 4. Try base64 after stripping scheme prefix
    for (const prefix of ['x402 ', 'payment:', 'payment ']) {
        if (trimmed.toLowerCase().startsWith(prefix)) {
            try {
                const b64Part = trimmed.slice(prefix.length).trim();
                const decoded = Buffer.from(b64Part, 'base64').toString('utf-8');
                return JSON.parse(decoded);
            } catch {}
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Signature Extraction — Handle multiple formats
// ---------------------------------------------------------------------------

function extractSignature(payload: any, auth: any): any | null {
    // Direct signature field (hex string)
    if (payload.signature && typeof payload.signature === 'string') {
        return payload.signature;
    }
    if (auth.signature && typeof auth.signature === 'string') {
        return auth.signature;
    }

    // {v, r, s} object at top level or in auth
    if (auth.v !== undefined && auth.r && auth.s) {
        return ethers.Signature.from({ v: Number(auth.v), r: auth.r, s: auth.s });
    }
    if (payload.v !== undefined && payload.r && payload.s) {
        return ethers.Signature.from({ v: Number(payload.v), r: payload.r, s: payload.s });
    }

    // Nested signature object
    if (payload.signature && typeof payload.signature === 'object') {
        const sig = payload.signature;
        if (sig.v !== undefined && sig.r && sig.s) {
            return ethers.Signature.from({ v: Number(sig.v), r: sig.r, s: sig.s });
        }
    }

    return null;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function requirePayment(config: PaymentConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // -----------------------------------------------------------------
            // 1. Admin Bypass
            // -----------------------------------------------------------------
            if (ADMIN_BYPASS_KEY && req.headers['x-admin-bypass'] === ADMIN_BYPASS_KEY) {
                console.log('[x402] Admin bypass — skipping payment');
                return next();
            }

            // -----------------------------------------------------------------
            // 2. Check ALL possible payment headers
            // -----------------------------------------------------------------
            const rawHeader = (
                req.headers['payment-signature'] ||
                req.headers['x-payment'] ||
                req.headers['authorization']
            ) as string | undefined;

            if (rawHeader && rawHeader.trim().length > 0) {
                console.log('[x402] Payment header found, attempting verification...');
                console.log(`[x402] Header value (first 200 chars): ${rawHeader.substring(0, 200)}`);

                // Parse the header
                const payload = tryParsePaymentHeader(rawHeader);

                if (!payload) {
                    console.error('[x402] Could not parse payment header as JSON');
                    return res.status(402).json({
                        error: 'Could not parse payment header',
                        code: 'PAYMENT_INVALID',
                        hint: 'Expected JSON payload with EIP-3009 authorization fields',
                        receivedHeaderPreview: rawHeader.substring(0, 100),
                    });
                }

                console.log(`[x402] Parsed payload keys: ${Object.keys(payload).join(', ')}`);

                // After tryParsePaymentHeader succeeds, unwrap nested payload
                let dw = payload.data || payload;
                // The task-402-pay client nests under a "payload" key
                if (dw.payload && !dw.authorization && !dw.signature) {
                    dw = dw.payload;
                }

                // Extract authorization fields
                const auth = dw.authorization || dw;
                console.log(`[x402] Auth keys: ${Object.keys(auth).join(', ')}`);

                // Extract signature
                const signature = extractSignature(dw, auth);

                if (!signature) {
                    console.error('[x402] Could not extract signature from payload');
                    return res.status(402).json({
                        error: 'Missing signature in payment payload',
                        code: 'PAYMENT_INVALID',
                        payloadKeys: Object.keys(payload),
                        authKeys: Object.keys(auth),
                    });
                }

                // Extract payment amount (could be 'amount' or 'value')
                const paymentAmount = auth.amount !== undefined ? auth.amount : auth.value;

                if (!auth.from || !auth.to || paymentAmount === undefined) {
                    console.error('[x402] Missing required TokenPayment fields');
                    return res.status(402).json({
                        error: 'Missing required TokenPayment fields (from, to, amount/value)',
                        code: 'PAYMENT_INVALID',
                        authKeys: Object.keys(auth),
                    });
                }

                // Validate recipient
                if (auth.to.toLowerCase() !== RECEIVING_WALLET_LC) {
                    console.error(`[x402] Recipient mismatch: got ${auth.to}, expected ${RECEIVING_WALLET}`);
                    return res.status(402).json({
                        error: 'Payment recipient mismatch',
                        code: 'PAYMENT_INVALID',
                        expected: { payTo: RECEIVING_WALLET, asset: USDT_XLAYER, network: `eip155:${CHAIN_ID}` }
                    });
                }

                // Validate amount
                const requiredBase = BigInt(toBaseUnits(config.amount));
                const paidAmount = BigInt(paymentAmount);
                if (paidAmount < requiredBase) {
                    console.error(`[x402] Insufficient: paid ${paidAmount}, need ${requiredBase}`);
                    return res.status(402).json({
                        error: 'Insufficient payment amount',
                        code: 'PAYMENT_INVALID',
                        expected: { payTo: RECEIVING_WALLET, asset: USDT_XLAYER, network: `eip155:${CHAIN_ID}` }
                    });
                }

                // Build possible EIP-712 messages
                const messageFull = {
                    from: auth.from,
                    to: auth.to,
                    value: paymentAmount.toString(),
                    validAfter: (auth.validAfter || '0').toString(),
                    validBefore: (auth.validBefore || '0').toString(),
                    nonce: auth.nonce || ethers.ZeroHash,
                };
                
                const messageShort = {
                    from: auth.from,
                    to: auth.to,
                    value: paymentAmount.toString(),
                    nonce: auth.nonce || ethers.ZeroHash,
                };

                // Try verification against multiple possible domain separators and types
                let recovered: string | null = null;
                let lastError: string = '';

                for (const domain of EIP712_DOMAINS) {
                    for (const typesDef of eip712TypesList) {
                        try {
                            const msg = typesDef.TransferWithAuthorization.length === 6 ? messageFull : messageShort;
                            recovered = ethers.verifyTypedData(domain, typesDef, msg, signature);
                            if (recovered.toLowerCase() === auth.from.toLowerCase()) {
                                console.log(`[x402] TransferWithAuthorization Verified ✅ (domain: ${domain.name} v${domain.version}, fields: ${typesDef.TransferWithAuthorization.length})`);
                                return next();
                            }
                            lastError = `Recovered ${recovered} but expected ${auth.from}`;
                        } catch (e: any) {
                            lastError = e.message;
                            continue;
                        }
                    }
                }

                // If we got here, no domain matched
                console.error(`[x402] Signature verification failed across all domains. Last error: ${lastError}`);
                return res.status(402).json({
                    error: 'EIP-712 TransferWithAuthorization signature verification failed',
                    code: 'PAYMENT_INVALID',
                    debug: lastError,
                    expected: { scheme: 'exact', payTo: RECEIVING_WALLET, asset: USDT_XLAYER, network: `eip155:${CHAIN_ID}` }
                });
            }

            // -----------------------------------------------------------------
            // 3. No payment header present — issue challenge
            // -----------------------------------------------------------------
            const challenge = buildChallenge(config.amount);
            const challengeJson = JSON.stringify(challenge);
            const base64Challenge = Buffer.from(challengeJson).toString('base64');

            res.setHeader('PAYMENT-REQUIRED', base64Challenge);
            res.setHeader('WWW-Authenticate', `Payment realm="Aegis", intent="charge"`);

            res.status(402).json(challenge);
            return;
        } catch (error: any) {
            console.error('[x402] Middleware error:', error);
            return res.status(500).json({
                status: 'error',
                error: 'Payment verification unavailable',
                detail: error.message,
                code: 'PAYMENT_SYSTEM_ERROR',
            });
        }
    };
}
