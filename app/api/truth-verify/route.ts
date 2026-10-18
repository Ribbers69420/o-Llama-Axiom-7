import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  CHAPTER_SCENES,
  evaluateTruthClaimDeterministic,
  type ExpressionId,
  type TruthVerificationResult,
} from '@/lib/game-rules';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const claim = typeof body?.claim === 'string' ? body.claim.trim() : '';
    const chapterIndex = typeof body?.chapterIndex === 'number' ? body.chapterIndex : 0;

    if (!claim) {
      return NextResponse.json(
        { error: 'Please provide a non-empty claim or anomaly statement to verify.' },
        { status: 400 }
      );
    }

    const chapter = CHAPTER_SCENES[chapterIndex] || CHAPTER_SCENES[0];
    const apiKey = process.env.GEMINI_API_KEY;

    // Attempt high-thinking verification with gemini-4-argon if a valid API key is present
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: `You are AXIOM-7, the Guardian of Truth in PIXELVERSE-9 (currently stationed in ${chapter.location}, ${chapter.chapterLabel}: ${chapter.title}).
Evaluate the following statement against the Four Pillars of Truth (FACTS, EVIDENCE, DATA, REALITY):
Statement: "${claim}"`,
          config: {
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                verdict: {
                  type: Type.STRING,
                  description: 'TRUE, FALSE, or UNVERIFIED',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence percentage between 85 and 99.9',
                },
                accuracyRating: {
                  type: Type.NUMBER,
                  description: 'Accuracy rating percentage around 99.7',
                },
                recommendedExpression: {
                  type: Type.STRING,
                  description: 'EX-06 for TRUE, EX-05 for FALSE, EX-02 for UNVERIFIED',
                },
                pillars: {
                  type: Type.OBJECT,
                  properties: {
                    FACTS: {
                      type: Type.OBJECT,
                      properties: {
                        score: { type: Type.INTEGER },
                        note: { type: Type.STRING },
                      },
                      required: ['score', 'note'],
                    },
                    EVIDENCE: {
                      type: Type.OBJECT,
                      properties: {
                        score: { type: Type.INTEGER },
                        note: { type: Type.STRING },
                      },
                      required: ['score', 'note'],
                    },
                    DATA: {
                      type: Type.OBJECT,
                      properties: {
                        score: { type: Type.INTEGER },
                        note: { type: Type.STRING },
                      },
                      required: ['score', 'note'],
                    },
                    REALITY: {
                      type: Type.OBJECT,
                      properties: {
                        score: { type: Type.INTEGER },
                        note: { type: Type.STRING },
                      },
                      required: ['score', 'note'],
                    },
                  },
                  required: ['FACTS', 'EVIDENCE', 'DATA', 'REALITY'],
                },
                thinkingSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '4 to 5 concise high-thinking epistemological steps',
                },
                summaryConclusion: {
                  type: Type.STRING,
                  description: 'Concise verdict conclusion stamped by AXIOM-7',
                },
              },
              required: [
                'verdict',
                'confidence',
                'accuracyRating',
                'recommendedExpression',
                'pillars',
                'thinkingSteps',
                'summaryConclusion',
              ],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const result: TruthVerificationResult = {
            claim,
            verdict:
              parsed.verdict === 'FALSE'
                ? 'FALSE'
                : parsed.verdict === 'UNVERIFIED'
                ? 'UNVERIFIED'
                : 'TRUE',
            confidence: Number(parsed.confidence) || 98.2,
            accuracyRating: Number(parsed.accuracyRating) || 99.7,
            recommendedExpression: (parsed.recommendedExpression as ExpressionId) || 'EX-06',
            pillars: parsed.pillars,
            thinkingSteps: Array.isArray(parsed.thinkingSteps)
              ? parsed.thinkingSteps
              : ['Evaluated across all 4 Pillars of Truth.'],
            summaryConclusion: parsed.summaryConclusion || 'Verified by AXIOM-7.',
            engineSource: 'gemini-4-argon-high',
          };
          return NextResponse.json(result);
        }
      } catch {
        // Gracefully fall back to deterministic 4-pillar verification if paid model key is unavailable
      }
    }

    const fallbackResult = evaluateTruthClaimDeterministic(claim, chapterIndex);
    return NextResponse.json(fallbackResult);
  } catch {
    return NextResponse.json(
      { error: 'Failed to process truth verification request.' },
      { status: 500 }
    );
  }
}
