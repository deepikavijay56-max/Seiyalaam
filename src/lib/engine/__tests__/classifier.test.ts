import { describe, it, expect } from 'vitest';
import {
  classifyDevice,
  isSafeTeardown,
  isSafeListing,
  SAFETY_KEYS,
  type DeviceClass,
  type ChecklistAnswers,
} from '../classifier';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('classifyDevice – safety flags force E', () => {
  it('swollen battery → E regardless of other answers', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: true,
      physical_damage: false,
      swollen_battery: true,  // SAFETY
      burn_marks: false,
      mains_caps: false,
    })).toBe('E');
  });

  it('burn marks → E', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: true,
      physical_damage: false,
      swollen_battery: false,
      burn_marks: true,       // SAFETY
      mains_caps: false,
    })).toBe('E');
  });

  it('mains capacitors → E', () => {
    expect(classifyDevice({
      powers_on: false,
      main_function: false,
      physical_damage: true,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: true,       // SAFETY
    })).toBe('E');
  });

  it('multiple safety flags → E', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: true,
      physical_damage: false,
      swollen_battery: true,
      burn_marks: true,
      mains_caps: false,
    })).toBe('E');
  });
});

describe('classifyDevice – normal classes', () => {
  it('powers on, main function works, no damage → A', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: true,
      physical_damage: false,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: false,
    })).toBe('A');
  });

  it('powers on, main function works, has damage → B', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: true,
      physical_damage: true,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: false,
    })).toBe('B');
  });

  it('powers on but main function fails → C', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: false,
      physical_damage: false,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: false,
    })).toBe('C');
  });

  it('powers on but main function fails, has damage → C', () => {
    expect(classifyDevice({
      powers_on: true,
      main_function: false,
      physical_damage: true,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: false,
    })).toBe('C');
  });

  it('does not power on → D', () => {
    expect(classifyDevice({
      powers_on: false,
      main_function: false,
      physical_damage: false,
      swollen_battery: false,
      burn_marks: false,
      mains_caps: false,
    })).toBe('D');
  });
});

describe('classifyDevice – partial answers', () => {
  it('handles missing answers gracefully (defaults to falsy)', () => {
    // Empty answers – no safety flags, not working → D
    expect(classifyDevice({})).toBe('D');
  });
});

describe('isSafeTeardown', () => {
  it('A, B, C, D are safe for teardown', () => {
    const safeClasses: DeviceClass[] = ['A', 'B', 'C', 'D'];
    for (const cls of safeClasses) {
      expect(isSafeTeardown(cls)).toBe(true);
    }
  });

  it('E is NOT safe for teardown', () => {
    expect(isSafeTeardown('E')).toBe(false);
  });
});

describe('isSafeListing', () => {
  it('A, B, C, D can be listed', () => {
    const safeClasses: DeviceClass[] = ['A', 'B', 'C', 'D'];
    for (const cls of safeClasses) {
      expect(isSafeListing(cls)).toBe(true);
    }
  });

  it('E cannot be listed', () => {
    expect(isSafeListing('E')).toBe(false);
  });
});

describe('SAFETY_KEYS', () => {
  it('includes all three safety question ids', () => {
    expect(SAFETY_KEYS).toContain('swollen_battery');
    expect(SAFETY_KEYS).toContain('burn_marks');
    expect(SAFETY_KEYS).toContain('mains_caps');
  });
});
