import type { User, Session } from '@supabase/supabase-js';
import type { Condition, Project, Component as EngineComponent, ScoreResult } from '../lib/engine/matcher';
import type { DeviceClass, ChecklistAnswers } from '../lib/engine/classifier';

export type { Condition, Project, EngineComponent, ScoreResult, DeviceClass, ChecklistAnswers };

export type Language = 'en' | 'ta';
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  area: string | null;
  language: Language;
  role: UserRole;
  created_at?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export interface InventoryItem {
  id: string;
  component_id: string;
  componentName: string;
  quantity: number;
  condition: Condition;
  available_to_share: boolean;
}

export interface DbInventoryRow {
  id: string;
  user_id: string;
  component_id: string;
  quantity: number;
  condition: Condition;
  available_to_share: boolean;
  created_at: string;
}

export interface AssessedDeviceRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceClass: DeviceClass;
  answers: Partial<ChecklistAnswers>;
  assessedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Kandupidi Mode (AI Inventor + Verifier) Types
export interface RawIdeaPart {
  name: string;
  qty: number;
}

export interface RawIdea {
  title: string;
  description: string;
  partsUsed: RawIdeaPart[];
  steps: string[];
  supplyVoltage?: number | string;
}

export interface ValidatedPart {
  name: string;
  needed: number;
  owned: number;
  missing: number;
  voltage?: number | null;
  safety_tags: string[];
}

export interface VoltageCompatibility {
  compatible: boolean;
  supplyVoltage?: number | string;
  converterSuggested?: string;
  notes?: string;
}

export type ValidationStatus = 'verified' | 'needs_parts' | 'rejected';

export interface ValidatedIdea {
  id: string;
  title: string;
  description: string;
  partsUsed: ValidatedPart[];
  steps: string[];
  supplyVoltage?: number | string;
  status: ValidationStatus;
  rejectionReason?: string;
  missingCount: number;
  voltageCompatibility: VoltageCompatibility;
  is_ai_generated: boolean;
  createdAt: string;
}

// Community Board Types
export type OfferType = 'free' | 'swap' | 'donate';
export type ListingStatus = 'available' | 'requested' | 'taken';
export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface CommunityListing {
  id: string;
  user_id: string;
  owner_name: string;
  owner_contact?: string; // Revealed ONLY after Accept!
  title: string;
  device_or_component: 'device' | 'component';
  item_name: string;
  quantity: number;
  device_class?: DeviceClass;
  offer_type: OfferType;
  area: string;
  photo_url?: string;
  status: ListingStatus;
  created_at: string;
  parts_inside?: { name: string; qty: number }[];
}

export interface CommunityRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  requester_name: string;
  requester_contact?: string;
  message: string;
  status: RequestStatus;
  created_at: string;
}

export interface ImpactEventRecord {
  id: string;
  user_id: string;
  kind: string;
  grams_diverted: number;
  created_at: string;
}

