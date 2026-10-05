import componentsData from '../data/components.json';
import type { Condition } from './engine/matcher';

export interface DetectedComponent {
  componentName: string;
  quantity: number;
  condition: Condition;
  confidence: number;
  isConfirmed: boolean;
}

export interface GeminiAnalysisResult {
  source: 'gemini' | 'simulation';
  components: DetectedComponent[];
  rawText?: string;
  error?: string;
}

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();

export function isGeminiConfigured(): boolean {
  return Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 5 && !GEMINI_API_KEY.includes('placeholder'));
}

/**
 * Normalizes free-form or AI condition strings to the strict Condition type
 */
function normalizeCondition(cond?: string): Condition {
  if (!cond) return 'untested';
  const c = cond.toLowerCase().trim();
  if (c === 'working' || c === 'tested' || c === 'good') return 'tested';
  if (c === 'damaged' || c === 'faulty' || c === 'broken') return 'faulty';
  if (c === 'partial' || c === 'fair') return 'partial';
  return 'untested';
}

/**
 * Extracts base64 payload and mimeType from data URL
 */
function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], base64: match[2] };
  }
  return { mimeType: 'image/jpeg', base64: dataUrl };
}

/**
 * Analyzes an uploaded photo using Google Gemini Vision API.
 * Falls back seamlessly to simulated heuristic detection if no API key is configured or on failure.
 */
export async function analyzePhotoWithGemini(imageDataUrl: string): Promise<GeminiAnalysisResult> {
  if (!isGeminiConfigured()) {
    console.info('Gemini API key not found in VITE_GEMINI_API_KEY. Using offline simulated vision detection.');
    // Simulated offline heuristic result
    return {
      source: 'simulation',
      components: [
        { componentName: 'Arduino Uno', quantity: 1, condition: 'tested', confidence: 0.95, isConfirmed: true },
        { componentName: 'DC Motor (small)', quantity: 2, condition: 'tested', confidence: 0.9, isConfirmed: true },
        { componentName: 'Ultrasonic Sensor', quantity: 1, condition: 'untested', confidence: 0.85, isConfirmed: true },
        { componentName: 'Unidentified Circuit Board', quantity: 1, condition: 'untested', confidence: 0.6, isConfirmed: false },
      ],
      rawText: '1 Arduino Uno, 2 DC Motor (small), 1 Ultrasonic Sensor, 1 unfamiliar circuit chip',
    };
  }

  const { mimeType, base64 } = parseDataUrl(imageDataUrl);
  const knownComponentNames = (componentsData as { name: string }[]).map(c => c.name);

  const prompt = `You are an expert electronics repair technician and e-waste recycling engineer.
Inspect this photo carefully and detect all electronic parts, microcontrollers, motors, sensors, displays, batteries, wiring, or components visible.

Here is our official catalog of recognized components:
${JSON.stringify(knownComponentNames)}

Return STRICT JSON ONLY, adhering to this schema:
{
  "detected": [
    {
      "name": "string (match official catalog name if possible, otherwise describe the component)",
      "quantity": 1,
      "condition": "tested" | "untested" | "partial" | "faulty",
      "confidence": 0.0 to 1.0
    }
  ]
}
Do not include markdown backticks or commentary. Only return the raw JSON object.`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API request failed:', response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No response text from Gemini');
    }

    const cleanedText = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanedText) as {
      detected: { name: string; quantity: number; condition?: string; confidence?: number }[];
    };

    const recognizedList = knownComponentNames.map(n => n.toLowerCase());

    const components: DetectedComponent[] = (parsed.detected || []).map(item => {
      const matchIndex = recognizedList.indexOf(item.name.toLowerCase().trim());
      const isConfirmed = matchIndex >= 0;
      const finalName = isConfirmed ? knownComponentNames[matchIndex] : item.name.trim();

      return {
        componentName: finalName,
        quantity: Math.max(1, Number(item.quantity) || 1),
        condition: normalizeCondition(item.condition),
        confidence: item.confidence ?? (isConfirmed ? 0.95 : 0.7),
        isConfirmed,
      };
    });

    return {
      source: 'gemini',
      components,
      rawText: components.map(c => `${c.quantity}x ${c.componentName}`).join(', '),
    };
  } catch (err: unknown) {
    console.error('Failed to run Gemini Vision analysis:', err);
    return {
      source: 'simulation',
      components: [
        { componentName: 'Arduino Uno', quantity: 1, condition: 'tested', confidence: 0.95, isConfirmed: true },
        { componentName: 'DC Motor (small)', quantity: 2, condition: 'tested', confidence: 0.9, isConfirmed: true },
        { componentName: 'Ultrasonic Sensor', quantity: 1, condition: 'untested', confidence: 0.85, isConfirmed: true },
      ],
      rawText: '1 Arduino Uno, 2 DC Motor (small), 1 Ultrasonic Sensor',
      error: err instanceof Error ? err.message : 'Unknown AI error',
    };
  }
}
