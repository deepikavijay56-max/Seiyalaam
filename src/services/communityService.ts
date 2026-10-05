import type {
  CommunityListing,
  CommunityRequest,
  OfferType,
  ListingStatus,
  InventoryItem,
  DeviceClass,
} from '../types';
import { supabase } from '../lib/supabase';
import devicesData from '../data/devices.json';
import componentsData from '../data/components.json';
import projectsData from '../data/projects.json';
import type { Project } from '../lib/engine/matcher';

const STORAGE_LISTINGS_KEY = 'seiyalaam_community_listings';
const STORAGE_REQUESTS_KEY = 'seiyalaam_community_requests';
const STORAGE_IMPACT_KEY = 'seiyalaam_impact_events';

interface DeviceItem {
  id: string;
  name: string;
  parts: { name: string; qty: number }[];
}

const DEVICES: DeviceItem[] = devicesData as unknown as DeviceItem[];

/**
 * Default sample listings for immediate community engagement
 */
const INITIAL_DEMO_LISTINGS: CommunityListing[] = [
  {
    id: 'list-demo-1',
    user_id: 'usr-kavitha',
    owner_name: 'Kavitha R.',
    owner_contact: 'kavitha.maker@gmail.com | +91 98401 23456',
    title: 'Functional Ultrasonic Sensors (HC-SR04)',
    device_or_component: 'component',
    item_name: 'Ultrasonic Sensor',
    quantity: 2,
    offer_type: 'free',
    area: 'Chennai - Adyar',
    status: 'available',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    parts_inside: [{ name: 'Ultrasonic Sensor', qty: 2 }],
  },
  {
    id: 'list-demo-2',
    user_id: 'usr-senthil',
    owner_name: 'Senthil Kumar',
    owner_contact: 'senthil.iot@yahoo.in | +91 94440 98765',
    title: 'Old Broken DVD Player (Class D)',
    device_or_component: 'device',
    item_name: 'DVD Player',
    quantity: 1,
    device_class: 'D',
    offer_type: 'donate',
    area: 'Coimbatore - Peelamedu',
    status: 'available',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    parts_inside: [
      { name: 'Stepper Motor', qty: 1 },
      { name: 'DC Motor (small)', qty: 1 },
      { name: 'IR Sensor', qty: 1 },
    ],
  },
  {
    id: 'list-demo-3',
    user_id: 'usr-anand',
    owner_name: 'Anand V.',
    owner_contact: 'anand.robotics@outlook.com',
    title: 'Spare 18650 Li-ion Cells (Tested 3.8V)',
    device_or_component: 'component',
    item_name: '18650 Li-ion Battery',
    quantity: 4,
    device_class: 'B',
    offer_type: 'swap',
    area: 'Madurai - KK Nagar',
    status: 'available',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    parts_inside: [{ name: '18650 Li-ion Battery', qty: 4 }],
  },
  {
    id: 'list-demo-4',
    user_id: 'usr-priya',
    owner_name: 'Priya Mani',
    owner_contact: 'priya.hardware@gmail.com',
    title: 'Old Laptop (Display intact, dead motherboard)',
    device_or_component: 'device',
    item_name: 'Old Laptop',
    quantity: 1,
    device_class: 'C',
    offer_type: 'free',
    area: 'Chennai - Velachery',
    status: 'available',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    parts_inside: [
      { name: '18650 Li-ion Battery', qty: 3 },
      { name: 'Speaker (small)', qty: 2 },
      { name: 'LCD Display (16x2)', qty: 1 },
    ],
  },
];

/**
 * Extracts parts list from devices.json or components.json
 */
export function getPartsInside(
  deviceOrComponent: 'device' | 'component',
  itemName: string,
  quantity = 1
): { name: string; qty: number }[] {
  if (deviceOrComponent === 'device') {
    const matchedDevice = DEVICES.find(
      d => d.name.toLowerCase() === itemName.toLowerCase() || d.id === itemName
    );
    if (matchedDevice && matchedDevice.parts) {
      return matchedDevice.parts.map(p => ({
        name: p.name,
        qty: p.qty * Math.max(1, quantity),
      }));
    }
    return [{ name: itemName, qty: quantity }];
  } else {
    return [{ name: itemName, qty: quantity }];
  }
}

/**
 * Helper to get local listings from storage
 */
function getLocalListings(): CommunityListing[] {
  try {
    const data = localStorage.getItem(STORAGE_LISTINGS_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_LISTINGS_KEY, JSON.stringify(INITIAL_DEMO_LISTINGS));
      return INITIAL_DEMO_LISTINGS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_DEMO_LISTINGS;
  }
}

function saveLocalListings(listings: CommunityListing[]): void {
  try {
    localStorage.setItem(STORAGE_LISTINGS_KEY, JSON.stringify(listings));
  } catch (err) {
    console.error('Failed to save community listings to localStorage', err);
  }
}

function getLocalRequests(): CommunityRequest[] {
  try {
    const data = localStorage.getItem(STORAGE_REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(requests: CommunityRequest[]): void {
  try {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save requests to localStorage', err);
  }
}

/**
 * Fetches all community listings
 */
export async function fetchListings(): Promise<CommunityListing[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          owner_name: item.title?.split(' - ')[0] || 'Community Maker',
          title: item.title,
          device_or_component: item.device_or_component as 'device' | 'component',
          item_name: item.device_or_component,
          quantity: item.quantity,
          device_class: item.device_class as DeviceClass,
          offer_type: item.offer_type as OfferType,
          area: item.area,
          photo_url: item.photo_url,
          status: item.status as ListingStatus,
          created_at: item.created_at,
          parts_inside: getPartsInside(item.device_or_component, item.title, item.quantity),
        }));
      }
    } catch {
      // Fallback to local storage
    }
  }

  return getLocalListings();
}

/**
 * Creates a new community listing.
 * CRITICAL RULE: Class E is BLOCKED!
 */
export async function createListing(input: {
  user_id: string;
  owner_name: string;
  owner_contact: string;
  title: string;
  device_or_component: 'device' | 'component';
  item_name: string;
  quantity: number;
  device_class?: DeviceClass;
  offer_type: OfferType;
  area: string;
  photo_url?: string;
}): Promise<CommunityListing> {
  // STRICT RULE: Class E blocked
  if (input.device_class === 'E') {
    throw new Error(
      'Class E items are hazardous e-waste (Recycle Only) and cannot be posted on the community board.'
    );
  }

  const parts_inside = getPartsInside(
    input.device_or_component,
    input.item_name,
    input.quantity
  );

  const newListing: CommunityListing = {
    id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: input.user_id,
    owner_name: input.owner_name,
    owner_contact: input.owner_contact,
    title: input.title,
    device_or_component: input.device_or_component,
    item_name: input.item_name,
    quantity: Math.max(1, input.quantity),
    device_class: input.device_class,
    offer_type: input.offer_type,
    area: input.area,
    photo_url: input.photo_url,
    status: 'available',
    created_at: new Date().toISOString(),
    parts_inside,
  };

  // Try Supabase insert
  if (supabase) {
    try {
      await supabase.from('listings').insert({
        id: newListing.id,
        user_id: newListing.user_id,
        title: newListing.title,
        device_or_component: newListing.device_or_component,
        quantity: newListing.quantity,
        device_class: newListing.device_class || null,
        offer_type: newListing.offer_type,
        area: newListing.area,
        photo_url: newListing.photo_url || null,
        status: 'available',
      });
    } catch (err) {
      console.warn('Failed to insert listing into Supabase, using local:', err);
    }
  }

  // Update localStorage
  const current = getLocalListings();
  current.unshift(newListing);
  saveLocalListings(current);

  return newListing;
}

/**
 * Creates a request for a listing.
 * Changes listing status to 'requested'.
 */
export async function requestListing(input: {
  listing_id: string;
  requester_id: string;
  requester_name: string;
  requester_contact?: string;
  message: string;
}): Promise<CommunityRequest> {
  const newRequest: CommunityRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    listing_id: input.listing_id,
    requester_id: input.requester_id,
    requester_name: input.requester_name,
    requester_contact: input.requester_contact,
    message: input.message,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  // Save request to localStorage
  const requests = getLocalRequests();
  requests.push(newRequest);
  saveLocalRequests(requests);

  // Update listing status to 'requested'
  const listings = getLocalListings();
  const index = listings.findIndex(l => l.id === input.listing_id);
  if (index !== -1 && listings[index].status === 'available') {
    listings[index].status = 'requested';
    saveLocalListings(listings);
  }

  if (supabase) {
    try {
      await supabase.from('requests').insert({
        id: newRequest.id,
        listing_id: newRequest.listing_id,
        requester_id: newRequest.requester_id,
        message: newRequest.message,
        status: 'pending',
      });
      await supabase
        .from('listings')
        .update({ status: 'requested' })
        .eq('id', input.listing_id);
    } catch {
      // Handled via local fallback
    }
  }

  return newRequest;
}

/**
 * Responds to a request (accept or decline).
 * Contact details are revealed ONLY after accept.
 */
export async function respondToRequest(
  requestId: string,
  decision: 'accepted' | 'declined'
): Promise<{ request: CommunityRequest; listing?: CommunityListing }> {
  const requests = getLocalRequests();
  const reqIndex = requests.findIndex(r => r.id === requestId);
  if (reqIndex === -1) {
    throw new Error('Request not found');
  }

  requests[reqIndex].status = decision;
  saveLocalRequests(requests);

  const listings = getLocalListings();
  const listIndex = listings.findIndex(l => l.id === requests[reqIndex].listing_id);

  if (listIndex !== -1) {
    if (decision === 'declined') {
      listings[listIndex].status = 'available';
    }
    // If accepted, remains 'requested' until marked 'taken'
    saveLocalListings(listings);
  }

  if (supabase) {
    try {
      await supabase
        .from('requests')
        .update({ status: decision })
        .eq('id', requestId);

      if (decision === 'declined' && listIndex !== -1) {
        await supabase
          .from('listings')
          .update({ status: 'available' })
          .eq('id', requests[reqIndex].listing_id);
      }
    } catch {
      // Local fallback handled
    }
  }

  return {
    request: requests[reqIndex],
    listing: listIndex !== -1 ? listings[listIndex] : undefined,
  };
}

/**
 * Marks listing as 'taken' and logs an impact event (grams diverted).
 */
export async function markListingTaken(
  listingId: string,
  userId: string
): Promise<{ listing: CommunityListing; gramsDiverted: number }> {
  const listings = getLocalListings();
  const index = listings.findIndex(l => l.id === listingId);
  if (index === -1) {
    throw new Error('Listing not found');
  }

  listings[index].status = 'taken';
  saveLocalListings(listings);

  // Calculate grams diverted
  let grams = 0;
  if (listings[index].parts_inside && listings[index].parts_inside.length > 0) {
    for (const p of listings[index].parts_inside) {
      const comp = (componentsData as unknown as { name: string; weight_g: number }[]).find(
        c => c.name.toLowerCase() === p.name.toLowerCase()
      );
      grams += (comp?.weight_g || 40) * p.qty;
    }
  } else {
    grams = 450 * listings[index].quantity;
  }

  // Record impact event
  try {
    const rawEvents = localStorage.getItem(STORAGE_IMPACT_KEY);
    const events = rawEvents ? JSON.parse(rawEvents) : [];
    events.push({
      id: `imp-${Date.now()}`,
      user_id: userId,
      kind: 'community_handoff',
      grams_diverted: grams,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_IMPACT_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to log impact event:', err);
  }

  if (supabase) {
    try {
      await supabase
        .from('listings')
        .update({ status: 'taken' })
        .eq('id', listingId);

      await supabase.from('impact_events').insert({
        user_id: userId,
        kind: 'community_handoff',
        grams_diverted: grams,
      });
    } catch {
      // Local fallback handled
    }
  }

  return { listing: listings[index], gramsDiverted: grams };
}

/**
 * Fetches all requests for a user's listings or sent by the user
 */
export function fetchRequests(userId?: string): CommunityRequest[] {
  const requests = getLocalRequests();
  if (!userId) return requests;
  return requests;
}

/**
 * Checks if a community listing "Helps you build" a project from viewer's inventory.
 * Returns the matching project title and the missing part provided.
 */
export function checkHelpsYouBuild(
  listing: CommunityListing,
  inventory: InventoryItem[] = []
): { projectTitle: string; projectId: string; partProvided: string } | null {
  const availableParts = listing.parts_inside || [{ name: listing.item_name, qty: listing.quantity }];
  const projects = projectsData as unknown as Project[];

  // Find user's owned parts map
  const ownedMap = new Map<string, number>();
  for (const item of inventory) {
    if (item.condition !== 'faulty') {
      const prev = ownedMap.get(item.componentName.toLowerCase()) || 0;
      ownedMap.set(item.componentName.toLowerCase(), prev + item.quantity);
    }
  }

  for (const project of projects) {
    for (const req of project.requirements) {
      const owned = ownedMap.get(req.component.toLowerCase()) || 0;
      if (owned < req.qty) {
        // User is missing this part! Does this listing provide it?
        const match = availableParts.find(
          p => p.name.toLowerCase() === req.component.toLowerCase()
        );
        if (match) {
          return {
            projectTitle: project.title,
            projectId: project.id,
            partProvided: req.component,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Smart Gap Matching:
 * Finds community listings that offer the exact missing part needed for
 * the user's top project closest to completion.
 */
export function getSmartGapMatches(
  inventory: InventoryItem[] = [],
  listings: CommunityListing[] = []
): {
  topProject: Project;
  missingPart: string;
  matchedListings: CommunityListing[];
}[] {
  const projects = projectsData as unknown as Project[];
  const availableListings = listings.filter(l => l.status === 'available');

  const ownedMap = new Map<string, number>();
  for (const item of inventory) {
    if (item.condition !== 'faulty') {
      const prev = ownedMap.get(item.componentName.toLowerCase()) || 0;
      ownedMap.set(item.componentName.toLowerCase(), prev + item.quantity);
    }
  }

  // Rank projects by completeness (fewest missing requirements first)
  const rankedProjects = projects
    .map(project => {
      const missingRequirements: string[] = [];
      let ownedCount = 0;
      for (const req of project.requirements) {
        const owned = ownedMap.get(req.component.toLowerCase()) || 0;
        if (owned >= req.qty) {
          ownedCount += 1;
        } else {
          missingRequirements.push(req.component);
        }
      }
      return { project, missingRequirements, ownedCount };
    })
    .filter(p => p.missingRequirements.length > 0)
    .sort((a, b) => a.missingRequirements.length - b.missingRequirements.length);

  const results: {
    topProject: Project;
    missingPart: string;
    matchedListings: CommunityListing[];
  }[] = [];

  for (const { project, missingRequirements } of rankedProjects) {
    for (const missingPart of missingRequirements) {
      const matches = availableListings.filter(l => {
        const parts = l.parts_inside || [{ name: l.item_name, qty: l.quantity }];
        return parts.some(p => p.name.toLowerCase() === missingPart.toLowerCase());
      });

      if (matches.length > 0) {
        // Prevent duplicate project entries
        if (!results.some(r => r.topProject.id === project.id && r.missingPart === missingPart)) {
          results.push({
            topProject: project,
            missingPart,
            matchedListings: matches,
          });
        }
      }
    }

    if (results.length >= 3) break;
  }

  return results;
}
