import { describe, it, expect, beforeEach } from 'vitest';
import {
  createListing,
  requestListing,
  respondToRequest,
  markListingTaken,
  getPartsInside,
  checkHelpsYouBuild,
  getSmartGapMatches,
} from '../communityService';
import type { InventoryItem } from '../../types';

describe('Community Board Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('strictly blocks Class E device listings from being created', async () => {
    await expect(
      createListing({
        user_id: 'user-1',
        owner_name: 'Muthu',
        owner_contact: 'muthu@example.com',
        title: 'Exploded Microwave with exposed caps',
        device_or_component: 'device',
        item_name: 'Microwave',
        quantity: 1,
        device_class: 'E', // CLASS E BLOCKED
        offer_type: 'donate',
        area: 'Chennai',
      })
    ).rejects.toThrow(/Class E items are hazardous/i);
  });

  it('allows creating listings for safe classes (A, B, C, D) and components', async () => {
    const listing = await createListing({
      user_id: 'user-2',
      owner_name: 'Anitha',
      owner_contact: 'anitha@example.com',
      title: 'Old DVD Player for parts',
      device_or_component: 'device',
      item_name: 'DVD Player',
      quantity: 1,
      device_class: 'D',
      offer_type: 'free',
      area: 'Madurai',
    });

    expect(listing.id).toBeTruthy();
    expect(listing.status).toBe('available');
    expect(listing.device_class).toBe('D');
    expect(listing.parts_inside?.length).toBeGreaterThan(0);
  });

  it('extracts parts inside for known devices', () => {
    const parts = getPartsInside('device', 'Old Laptop', 1);
    expect(parts.some(p => p.name.includes('Battery'))).toBe(true);
    expect(parts.some(p => p.name.includes('Speaker'))).toBe(true);
  });

  it('detects when a listing helps you build a project from inventory', () => {
    // User only has Arduino Uno
    const userInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        component_id: 'c-uno',
        componentName: 'Arduino Uno',
        quantity: 1,
        condition: 'tested',
        available_to_share: false,
      },
    ];

    // Listing has Relay Module (which is needed for Smart Plant Watering System)
    const listing = {
      id: 'list-1',
      user_id: 'owner-1',
      owner_name: 'Ravi',
      title: 'Relay Module 5V',
      device_or_component: 'component' as const,
      item_name: 'Relay Module',
      quantity: 1,
      offer_type: 'free' as const,
      area: 'Chennai',
      status: 'available' as const,
      created_at: new Date().toISOString(),
      parts_inside: [{ name: 'Relay Module', qty: 1 }],
    };

    const helps = checkHelpsYouBuild(listing, userInventory);
    expect(helps).not.toBeNull();
    expect(helps?.partProvided).toBe('Relay Module');
  });

  it('manages request lifecycle: request -> accept -> take with impact logging', async () => {
    const listing = await createListing({
      user_id: 'user-owner',
      owner_name: 'Sundar',
      owner_contact: 'sundar@test.com',
      title: 'Ultrasonic Sensor HC-SR04',
      device_or_component: 'component',
      item_name: 'Ultrasonic Sensor',
      quantity: 1,
      offer_type: 'free',
      area: 'Coimbatore',
    });

    // 1. Submit request
    const request = await requestListing({
      listing_id: listing.id,
      requester_id: 'user-requester',
      requester_name: 'Vijay',
      requester_contact: 'vijay@test.com',
      message: 'Need this for my college robot project!',
    });

    expect(request.status).toBe('pending');

    // 2. Owner accepts
    const { request: acceptedReq } = await respondToRequest(request.id, 'accepted');
    expect(acceptedReq.status).toBe('accepted');

    // 3. Mark as taken
    const { listing: takenListing, gramsDiverted } = await markListingTaken(
      listing.id,
      'user-owner'
    );
    expect(takenListing.status).toBe('taken');
    expect(gramsDiverted).toBeGreaterThan(0);
  });

  it('identifies smart gap matches for top project missing parts', () => {
    // User has Arduino Uno and Jumper Wires (missing DC Motor and L298N for Obstacle Avoiding Robot)
    const userInventory: InventoryItem[] = [
      {
        id: 'inv-1',
        component_id: 'c-uno',
        componentName: 'Arduino Uno',
        quantity: 1,
        condition: 'tested',
        available_to_share: false,
      },
    ];

    const availableListings = [
      {
        id: 'list-motor',
        user_id: 'user-maker',
        owner_name: 'Dinesh',
        title: 'Small DC Motors from toy car',
        device_or_component: 'component' as const,
        item_name: 'DC Motor (small)',
        quantity: 2,
        offer_type: 'free' as const,
        area: 'Chennai',
        status: 'available' as const,
        created_at: new Date().toISOString(),
        parts_inside: [{ name: 'DC Motor (small)', qty: 2 }],
      },
    ];

    const gapMatches = getSmartGapMatches(userInventory, availableListings);
    expect(gapMatches.length).toBeGreaterThan(0);
    expect(gapMatches[0].matchedListings[0].id).toBe('list-motor');
  });
});
