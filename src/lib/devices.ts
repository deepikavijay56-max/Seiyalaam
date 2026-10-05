import { useState, useEffect } from 'react';
import devicesData from '../data/devices.json';
import {
  classifyDevice,
  type DeviceClass,
  type ChecklistAnswers,
  CLASS_LABELS,
  CLASS_DESCRIPTIONS,
} from './engine/classifier';

export interface DeviceChecklistItem {
  id: string;
  question: string;
  safety: boolean;
}

export interface DevicePart {
  name: string;
  qty: number;
}

export interface DeviceDefinition {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  warnings: string[];
  parts: DevicePart[];
  checklist: DeviceChecklistItem[];
}

export interface AssessedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceClass: DeviceClass;
  answers: Partial<ChecklistAnswers>;
  assessedAt: string;
}

const STORAGE_KEY = 'seiyalaam_assessed_devices';

export function getAssessedDevices(): AssessedDevice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAssessedDevice(assessed: AssessedDevice): void {
  try {
    const current = getAssessedDevices();
    const updated = [assessed, ...current.filter(d => d.id !== assessed.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function getDeviceCountsByClass(): Record<DeviceClass, number> {
  const devices = getAssessedDevices();
  const counts: Record<DeviceClass, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
  };

  for (const d of devices) {
    if (counts[d.deviceClass] !== undefined) {
      counts[d.deviceClass]++;
    }
  }

  return counts;
}

export function useAssessedDevices() {
  const [devices, setDevices] = useState<AssessedDevice[]>(() => getAssessedDevices());

  useEffect(() => {
    setDevices(getAssessedDevices());
  }, []);

  const refresh = () => setDevices(getAssessedDevices());

  return { devices, refresh };
}

export type { DeviceClass };
export {
  devicesData,
  classifyDevice,
  CLASS_LABELS,
  CLASS_DESCRIPTIONS,
};
