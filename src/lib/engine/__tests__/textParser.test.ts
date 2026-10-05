import { describe, it, expect } from 'vitest';
import { parseComponentsFromText } from '../textParser';

describe('parseComponentsFromText – English parsing', () => {
  it('parses numbers and known component names', () => {
    const input = 'I found 2 Arduino Uno and three Servo Motors in my drawer';
    const result = parseComponentsFromText(input);

    expect(result.matched).toHaveLength(2);
    expect(result.matched[0].componentName).toBe('Arduino Uno');
    expect(result.matched[0].quantity).toBe(2);
    expect(result.matched[1].componentName).toBe('Servo Motor');
    expect(result.matched[1].quantity).toBe(3);
    expect(result.confirmManually).toHaveLength(0);
  });

  it('detects conditions if specified', () => {
    const input = '1 tested ultrasonic sensor, 2 broken buzzer';
    const result = parseComponentsFromText(input);

    const sensor = result.matched.find(m => m.componentName === 'Ultrasonic Sensor');
    const buzzer = result.matched.find(m => m.componentName === 'Buzzer');

    expect(sensor?.condition).toBe('tested');
    expect(buzzer?.condition).toBe('faulty');
  });

  it('routes unknown components to confirmManually list', () => {
    const input = '2 Arduino Uno and 1 mysterious quantum widget';
    const result = parseComponentsFromText(input);

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].componentName).toBe('Arduino Uno');
    expect(result.confirmManually).toHaveLength(1);
    expect(result.confirmManually[0].rawName).toContain('mysterious quantum widget');
  });
});

describe('parseComponentsFromText – Tamil parsing', () => {
  it('parses Tamil number words and component aliases', () => {
    const input = 'இரண்டு ஆர்டுயினோ மற்றும் மூன்று சர்வோ மோட்டார்';
    const result = parseComponentsFromText(input);

    expect(result.matched).toHaveLength(2);
    expect(result.matched[0].componentName).toBe('Arduino Uno');
    expect(result.matched[0].quantity).toBe(2);
    expect(result.matched[1].componentName).toBe('Servo Motor');
    expect(result.matched[1].quantity).toBe(3);
  });
});
