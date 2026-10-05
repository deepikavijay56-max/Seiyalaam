import type { Condition } from './matcher';
import componentsData from '../../data/components.json';

export interface ParsedComponent {
  componentName: string;
  quantity: number;
  condition: Condition;
  confidence: number; // 0 to 1
}

export interface UnconfirmedComponent {
  rawName: string;
  suggestedQuantity: number;
  condition: Condition;
  suggestedMatch?: string;
}

export interface ParseResult {
  matched: ParsedComponent[];
  confirmManually: UnconfirmedComponent[];
  rawText: string;
}


// Built-in English & Tamil number dictionaries
const WORD_NUMBERS: Record<string, number> = {
  // English
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  // Tamil
  'ஒரு': 1,
  'ஒன்று': 1,
  'இரண்டு': 2,
  'ரெண்டு': 2,
  'மூன்று': 3,
  'மூணு': 3,
  'நான்கு': 4,
  'நாலு': 4,
  'ஐந்து': 5,
  'அஞ்சு': 5,
  'ஆறு': 6,
  'ஏழு': 7,
  'எட்டு': 8,
  'ஒன்பது': 9,
  'பத்து': 10,
};

// Aliases and phonetic transliterations for common electronics
const COMPONENT_ALIASES: Record<string, string[]> = {
  'Arduino Uno': ['uno', 'arduino', 'ஆர்டுயினோ', 'ஆர்டுயினோ யூனோ', 'ஆர்டினோ'],
  'Arduino Nano': ['nano', 'ஆர்டுயினோ நானோ'],
  'Raspberry Pi': ['rpi', 'raspi', 'raspberry', 'ராஸ்பெர்ரி பை'],
  'DC Motor (small)': ['dc motor', 'toy motor', 'மோட்டார்', 'டிசி மோட்டார்', 'சின்ன மோட்டார்'],
  'DC Motor (large)': ['large motor', '12v motor', 'பெரிய மோட்டார்'],
  'Servo Motor': ['servo', 'சர்வோ', 'சர்வோ மோட்டார்', 'sg90'],
  'Gear Motor': ['geared motor', 'bo motor', 'கியர் மோட்டார்'],
  'Stepper Motor': ['stepper', 'ஸ்டெப்பர் மோட்டார்'],
  'Ultrasonic Sensor': ['ultrasonic', 'sonar', 'distance sensor', 'hc-sr04', 'அல்ட்ராசோனிக்', 'அல்ட்ராசோனிக் சென்சார்'],
  'IR Sensor': ['infrared', 'ir', 'ஐஆர் சென்சார்', 'இன்பிராரெட்'],
  'DHT11 Sensor': ['dht11', 'temp sensor', 'humidity sensor', 'வெப்பநிலை சென்சார்'],
  'DHT22 Sensor': ['dht22'],
  'LDR Sensor': ['ldr', 'light sensor', 'ஒளி சென்சார்'],
  'PIR Sensor': ['pir', 'motion sensor', 'இயக்க சென்சார்'],
  'LED Strip (WS2812)': ['neopixel', 'ws2812', 'addressable led', 'rgb strip', 'எல்ஈடி', 'எல்இடி'],
  'LED Strip (Plain)': ['plain led', '12v led strip', 'white led strip'],
  'LCD Display (16x2)': ['16x2', 'lcd', 'எல்சிடி', 'டிஸ்ப்ளே'],
  'OLED Display': ['oled', '0.96 oled', 'ஓஎல்இடி'],
  'Speaker (small)': ['speaker', 'mini speaker', 'ஸ்பீக்கர்'],
  'Buzzer': ['piezo', 'beeper', 'பஸ்ஸர்'],
  'Relay Module': ['relay', '5v relay', 'ரிலே', 'ரிலே மாட்யூல்'],
  '18650 Li-ion Battery': ['18650', 'cylindrical battery', 'லித்தியம் பேட்டரி'],
  'LiPo Battery': ['lipo', 'drone battery', 'லிபோ பேட்டரி'],
  'Phone Battery': ['mobile battery', 'smartphone battery', 'செல்போன் பேட்டரி', 'பேட்டரி'],
  'Jumper Wires (set)': ['jumper', 'jumpers', 'jumper wires', 'wires', 'ஒயர்கள்', 'ஜம்பர் ஒயர்'],
  'Breadboard': ['bread board', 'solderless breadboard', 'பிரெட்போர்டு'],
  'L298N Motor Driver': ['l298n', 'l298', 'motor driver'],
  'L293D Motor Driver': ['l293d', 'l293'],
  'NRF24L01 Module': ['nrf24', 'nrf24l01', 'wireless module'],
  'HC-05 Bluetooth': ['hc05', 'hc-05', 'bluetooth', 'ப்ளூடூத்'],
};

const knownNames: string[] = (componentsData as { name: string }[]).map(c => c.name);

/**
 * Parses free text or voice speech transcript into structured component entries.
 * Pure deterministic rule-based parser.
 */
export function parseComponentsFromText(text: string): ParseResult {
  const matched: ParsedComponent[] = [];
  const confirmManually: UnconfirmedComponent[] = [];

  if (!text || !text.trim()) {
    return { matched, confirmManually, rawText: text };
  }

  // Split by clauses, commas, bullets, "and", "plus", "மற்றும்", "கூட"
  const clauses = text
    .split(/(?:,|\.|\n|;|\s+(?:and|plus|with|மற்றும்|கூட)\s+)/gi)
    .map(c => c.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    const tokens = clause.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // 1. Detect quantity
    let quantity = 1;
    let qtyTokenIdx = -1;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].replace(/[x×]/g, '');
      const num = parseInt(token, 10);
      if (!isNaN(num) && num > 0 && num < 1000) {
        quantity = num;
        qtyTokenIdx = i;
        break;
      }
      if (WORD_NUMBERS[token]) {
        quantity = WORD_NUMBERS[token];
        qtyTokenIdx = i;
        break;
      }
    }

    // 2. Detect condition if mentioned
    let condition: Condition = 'untested';
    if (clause.includes('tested') || clause.includes('working') || clause.includes('வேலை செய்கிறது')) {
      condition = 'tested';
    } else if (clause.includes('broken') || clause.includes('faulty') || clause.includes('பழுதடைந்த')) {
      condition = 'faulty';
    } else if (clause.includes('partial') || clause.includes('பகுதி')) {
      condition = 'partial';
    }

    // Remaining tokens after removing quantity
    const nameTokens = tokens.filter((_, idx) => idx !== qtyTokenIdx);
    const cleanedPhrase = nameTokens.join(' ').replace(/[^a-zA-Z0-9\u0B80-\u0BFF\s-]/g, '').trim();

    if (!cleanedPhrase || cleanedPhrase.length < 2) continue;

    // 3. Search exact known name match
    let foundMatch: string | null = null;
    const lowerPhrase = cleanedPhrase.toLowerCase();

    for (const name of knownNames) {
      if (lowerPhrase.includes(name.toLowerCase())) {
        foundMatch = name;
        break;
      }
    }

    // 4. Search aliases (check longer aliases first so e.g. "Servo Motor" / "சர்வோ மோட்டார்" matches before "மோட்டார்")
    if (!foundMatch) {
      const aliasEntries = Object.entries(COMPONENT_ALIASES).flatMap(([name, aliases]) =>
        aliases.map(alias => ({ name, alias }))
      ).sort((a, b) => b.alias.length - a.alias.length);

      for (const { name, alias } of aliasEntries) {
        if (lowerPhrase.includes(alias.toLowerCase())) {
          foundMatch = name;
          break;
        }
      }
    }

    // 5. Categorize
    if (foundMatch) {
      // Avoid duplicate matching in same parse run; sum quantities if already matched
      const existing = matched.find(m => m.componentName === foundMatch);
      if (existing) {
        existing.quantity += quantity;
      } else {
        matched.push({
          componentName: foundMatch,
          quantity,
          condition,
          confidence: 0.95,
        });
      }
    } else {
      // Suggest closest known component if any token matches
      let suggested: string | undefined;
      for (const name of knownNames) {
        const parts = name.toLowerCase().split(/\s+/);
        if (parts.some(p => p.length > 3 && lowerPhrase.includes(p))) {
          suggested = name;
          break;
        }
      }

      confirmManually.push({
        rawName: cleanedPhrase,
        suggestedQuantity: quantity,
        condition,
        suggestedMatch: suggested,
      });
    }
  }

  return { matched, confirmManually, rawText: text };
}
