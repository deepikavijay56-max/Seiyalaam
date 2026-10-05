import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Package,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
  MapPin,
  X,
  MessageSquare,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useInventory } from '../hooks/useInventory';
import {
  fetchListings,
  createListing,
  requestListing,
  respondToRequest,
  markListingTaken,
  fetchRequests,
  checkHelpsYouBuild,
  getSmartGapMatches,
} from '../services/communityService';
import type {
  CommunityListing,
  CommunityRequest,
  OfferType,
  ListingStatus,
  DeviceClass,
} from '../types';
import devicesData from '../data/devices.json';
import componentsData from '../data/components.json';

export default function Community() {
  const { user, profile } = useAuth();
  const { items: inventory } = useInventory();

  const [listings, setListings] = useState<CommunityListing[]>([]);
  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'device' | 'component'>('all');
  const [selectedOffer, setSelectedOffer] = useState<'all' | OfferType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ListingStatus>('all');
  const [selectedArea, setSelectedArea] = useState('all');

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [requestTargetListing, setRequestTargetListing] = useState<CommunityListing | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // New Listing Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'device' | 'component'>('component');
  const [formItemName, setFormItemName] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formDeviceClass, setFormDeviceClass] = useState<DeviceClass | ''>('B');
  const [formOfferType, setFormOfferType] = useState<OfferType>('free');
  const [formArea, setFormArea] = useState(profile?.area || 'Chennai - Adyar');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const fetchedListings = await fetchListings();
        if (isMounted) setListings(fetchedListings);
        const fetchedReqs = fetchRequests(user?.id);
        if (isMounted) setRequests(fetchedReqs);
      } catch (err) {
        console.error('Failed to load community data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Handle Post Creation with Class E check
  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (formType === 'device' && formDeviceClass === 'E') {
      setFormError('Class E items are hazardous (Recycle Only) and cannot be posted on the community board.');
      return;
    }

    if (!formTitle.trim() || !formItemName.trim()) {
      setFormError('Please enter a title and select the device or component.');
      return;
    }

    try {
      const created = await createListing({
        user_id: user?.id || 'guest-maker',
        owner_name: profile?.display_name || user?.email?.split('@')[0] || 'Community Maker',
        owner_contact: user?.email ? `${user.email} | Chennai Maker` : 'contact@seiyalaam.org',
        title: formTitle.trim(),
        device_or_component: formType,
        item_name: formItemName.trim(),
        quantity: Math.max(1, formQuantity),
        device_class: formType === 'device' ? (formDeviceClass as DeviceClass) : undefined,
        offer_type: formOfferType,
        area: formArea.trim() || 'Chennai',
        photo_url: formPhotoUrl.trim() || undefined,
      });

      setListings(prev => [created, ...prev]);
      setIsPostModalOpen(false);
      showToast('Listing posted to Community Board! 🎉');
      // Reset form
      setFormTitle('');
      setFormItemName('');
      setFormQuantity(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create listing');
    }
  }

  // Handle Request Submission
  async function handleSubmitRequest() {
    if (!requestTargetListing || !requestMessage.trim()) return;
    setSubmittingRequest(true);

    try {
      const req = await requestListing({
        listing_id: requestTargetListing.id,
        requester_id: user?.id || 'guest-requester',
        requester_name: profile?.display_name || user?.email?.split('@')[0] || 'E-waste Maker',
        requester_contact: user?.email || 'maker@seiyalaam.org',
        message: requestMessage.trim(),
      });

      setRequests(prev => [req, ...prev]);
      // Update listing state locally
      setListings(prev =>
        prev.map(l => (l.id === requestTargetListing.id ? { ...l, status: 'requested' } : l))
      );

      setRequestTargetListing(null);
      setRequestMessage('');
      showToast('Request submitted to owner! Contact info will unlock upon acceptance. 🔒');
    } catch (err) {
      console.error('Request failed:', err);
      showToast('Failed to submit request.');
    } finally {
      setSubmittingRequest(false);
    }
  }

  // Handle Owner Decision (Accept / Decline)
  async function handleRespond(requestId: string, decision: 'accepted' | 'declined') {
    try {
      const result = await respondToRequest(requestId, decision);
      setRequests(prev => prev.map(r => (r.id === requestId ? result.request : r)));
      if (result.listing) {
        setListings(prev => prev.map(l => (l.id === result.listing?.id ? result.listing! : l)));
      }
      showToast(
        decision === 'accepted'
          ? 'Request accepted! Contact details now revealed for handover. 🤝'
          : 'Request declined.'
      );
    } catch (err) {
      console.error('Failed to respond:', err);
    }
  }

  // Handle Marking as Taken (Updates Impact Events!)
  async function handleMarkTaken(listingId: string) {
    try {
      const { listing, gramsDiverted } = await markListingTaken(listingId, user?.id || 'maker');
      setListings(prev => prev.map(l => (l.id === listingId ? listing : l)));
      showToast(`Handoff completed! Logged ${gramsDiverted}g of e-waste diverted in Impact Events! 🌿`);
    } catch (err) {
      console.error('Failed to mark taken:', err);
    }
  }

  // Smart Gap Matches
  const gapMatches = useMemo(() => {
    return getSmartGapMatches(inventory, listings);
  }, [inventory, listings]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (selectedType !== 'all' && l.device_or_component !== selectedType) return false;
      if (selectedOffer !== 'all' && l.offer_type !== selectedOffer) return false;
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;
      if (selectedArea !== 'all' && !l.area.toLowerCase().includes(selectedArea.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesItem = l.item_name.toLowerCase().includes(q);
        const matchesArea = l.area.toLowerCase().includes(q);
        const matchesParts = l.parts_inside?.some(p => p.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesItem && !matchesArea && !matchesParts) return false;
      }
      return true;
    });
  }, [listings, selectedType, selectedOffer, selectedStatus, selectedArea, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-bg)', paddingBottom: 80 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            background: 'var(--color-slate-900)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <CheckCircle size={18} color="var(--color-green-400)" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(6,182,212,0.08) 0%, rgba(255,255,255,0) 100%)',
          borderBottom: '1px solid var(--surface-border)',
          padding: '44px 0 32px',
        }}
      >
        <div className="page-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  color: '#0891b2',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                <Users size={15} />
                <span>Circular Hardware Exchange</span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(26px, 3.8vw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: 'var(--color-slate-900)',
                  marginBottom: 12,
                }}
              >
                Community Hardware Board
              </h1>

              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Post salvaged devices and components for Free, Swap, or Donate. Class E hazardous e-waste is blocked. Contact details stay private until you accept a request.
              </p>
            </div>

            <button
              id="btn-post-listing"
              onClick={() => setIsPostModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(16,185,129,0.25)',
              }}
            >
              <PlusCircle size={18} />
              <span>Post Device / Part</span>
            </button>
          </div>
        </div>
      </section>

      <div className="page-container" style={{ paddingTop: 32 }}>
        {/* Smart Gap Matching Hero Card */}
        {gapMatches.length > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.08))',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 32,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Sparkles size={20} color="var(--color-green-600)" />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--color-slate-900)' }}>
                Smart Gap Match Detected!
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {gapMatches.map((gap, gIdx) => {
                const matched = gap.matchedListings[0];
                return (
                  <div
                    key={gIdx}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: '14px 18px',
                      border: '1px solid var(--surface-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Your project{' '}
                        <strong style={{ color: 'var(--color-slate-900)' }}>{gap.topProject.title}</strong> is
                        missing a <strong style={{ color: '#059669' }}>{gap.missingPart}</strong>!
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-slate-800)' }}>
                        Available from <strong>{matched.owner_name}</strong> in {matched.area} ({matched.offer_type.toUpperCase()})
                      </div>
                    </div>

                    <button
                      onClick={() => setRequestTargetListing(matched)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: 'var(--color-green-600)',
                        color: 'white',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <span>Request to Complete Project</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div
          style={{
            background: 'white',
            borderRadius: 14,
            padding: '16px 20px',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 28,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search bar */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              minWidth: 200,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-slate-400)',
              }}
            />
            <input
              type="text"
              placeholder="Search hardware, parts, area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid var(--surface-border)',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'device', 'component'] as const).map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid var(--surface-border)',
                  background: selectedType === t ? 'var(--color-slate-900)' : 'white',
                  color: selectedType === t ? 'white' : 'var(--color-slate-700)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Offer Filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'free', 'swap', 'donate'] as const).map(o => (
              <button
                key={o}
                onClick={() => setSelectedOffer(o)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid var(--surface-border)',
                  background: selectedOffer === o ? '#059669' : 'white',
                  color: selectedOffer === o ? 'white' : 'var(--color-slate-700)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as 'all' | ListingStatus)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--surface-border)',
              fontSize: 13,
              fontWeight: 500,
              background: 'white',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="requested">Requested</option>
            <option value="taken">Taken</option>
          </select>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--surface-border)',
              fontSize: 13,
              fontWeight: 500,
              background: 'white',
            }}
          >
            <option value="all">All Regions</option>
            <option value="Chennai">Chennai</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Madurai">Madurai</option>
          </select>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <RefreshCw size={28} className="spin-animation" color="var(--color-green-600)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading circular community hardware...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1px solid var(--surface-border)',
            }}
          >
            <Package size={40} color="var(--color-slate-400)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-slate-800)' }}>
              No matching listings found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' }}>
              Try adjusting your search filters or be the first to post a part!
            </p>
            <button
              onClick={() => setIsPostModalOpen(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'var(--color-green-600)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Post a Part or Device
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: 22,
            }}
          >
            {filteredListings.map(listing => {
              const helps = checkHelpsYouBuild(listing, inventory);
              const isOwner = user?.id && listing.user_id === user.id;
              const listingRequests = requests.filter(r => r.listing_id === listing.id);
              const acceptedRequest = listingRequests.find(r => r.status === 'accepted');

              return (
                <div
                  key={listing.id}
                  style={{
                    background: 'white',
                    borderRadius: 16,
                    border: '1px solid var(--surface-border)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      padding: '12px 18px',
                      background: 'var(--color-slate-50)',
                      borderBottom: '1px solid var(--surface-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background:
                            listing.offer_type === 'free'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : listing.offer_type === 'swap'
                              ? 'rgba(6, 182, 212, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            listing.offer_type === 'free'
                              ? '#047857'
                              : listing.offer_type === 'swap'
                              ? '#0e7490'
                              : '#b45309',
                        }}
                      >
                        {listing.offer_type}
                      </span>

                      {listing.device_class && (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: 'var(--color-slate-200)',
                            color: 'var(--color-slate-800)',
                          }}
                        >
                          Class {listing.device_class}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          listing.status === 'available'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : listing.status === 'requested'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'var(--color-slate-200)',
                        color:
                          listing.status === 'available'
                            ? '#059669'
                            : listing.status === 'requested'
                            ? '#d97706'
                            : 'var(--color-slate-600)',
                      }}
                    >
                      {listing.status}
                    </span>
                  </div>

                  {/* Helps You Build Banner */}
                  {helps && (
                    <div
                      style={{
                        background: 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12))',
                        borderBottom: '1px solid rgba(16,185,129,0.25)',
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#047857',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Sparkles size={14} />
                      <span>
                        Helps you build: <strong>{helps.projectTitle}</strong> (provides {helps.partProvided})
                      </span>
                    </div>
                  )}

                  {/* Card Body */}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: 'var(--color-slate-900)',
                        marginBottom: 6,
                      }}
                    >
                      {listing.title}
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        marginBottom: 14,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} />
                        {listing.area}
                      </span>
                      <span>Qty: {listing.quantity}</span>
                    </div>

                    {/* Parts Inside Display */}
                    {listing.parts_inside && listing.parts_inside.length > 0 && (
                      <div
                        style={{
                          background: 'var(--color-slate-50)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          marginBottom: 16,
                          border: '1px solid var(--surface-border)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--color-slate-500)',
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Layers size={12} />
                          <span>Parts Inside ({listing.parts_inside.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {listing.parts_inside.map((part, pIdx) => (
                            <span
                              key={pIdx}
                              style={{
                                background: 'white',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500,
                                border: '1px solid var(--surface-border)',
                                color: 'var(--color-slate-800)',
                              }}
                            >
                              {part.qty}× {part.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Privacy Protected Contact Info */}
                    <div
                      style={{
                        marginTop: 'auto',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: acceptedRequest ? 'rgba(16, 185, 129, 0.08)' : 'rgba(241, 245, 249, 0.7)',
                        border: acceptedRequest
                          ? '1px solid rgba(16, 185, 129, 0.3)'
                          : '1px solid var(--surface-border)',
                        fontSize: 12,
                        marginBottom: 14,
                      }}
                    >
                      {acceptedRequest ? (
                        <div style={{ color: 'var(--color-green-800)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 2 }}>
                            <Unlock size={14} color="var(--color-green-600)" />
                            <span>Request Accepted & Contact Unlocked:</span>
                          </div>
                          <div>{listing.owner_contact || 'Contact owner via chat'}</div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Lock size={14} />
                          <span>Contact details protected until owner accepts request</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div>
                      {isOwner ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Owner view of incoming requests */}
                          {listingRequests.length > 0 && (
                            <div style={{ fontSize: 12, marginBottom: 4 }}>
                              <strong>Incoming Requests ({listingRequests.length}):</strong>
                              {listingRequests.map(req => (
                                <div
                                  key={req.id}
                                  style={{
                                    background: 'var(--color-slate-100)',
                                    padding: '6px 8px',
                                    borderRadius: 6,
                                    marginTop: 4,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{req.requester_name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>&quot;{req.message}&quot;</div>
                                  </div>

                                  {req.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <button
                                        onClick={() => handleRespond(req.id, 'accepted')}
                                        style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: 'var(--color-green-600)',
                                          color: 'white',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 11,
                                          fontWeight: 600,
                                        }}
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleRespond(req.id, 'declined')}
                                        style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: 'var(--color-slate-300)',
                                          color: 'var(--color-slate-800)',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: 11,
                                        }}
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  )}
                                  {req.status === 'accepted' && (
                                    <span style={{ color: 'var(--color-green-700)', fontWeight: 700, fontSize: 11 }}>
                                      Accepted ✓
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {listing.status !== 'taken' && (
                            <button
                              onClick={() => handleMarkTaken(listing.id)}
                              style={{
                                width: '100%',
                                padding: '9px 14px',
                                borderRadius: 8,
                                background: 'var(--color-slate-900)',
                                color: 'white',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                              }}
                            >
                              Mark as Taken (Log Impact)
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setRequestTargetListing(listing)}
                          disabled={listing.status !== 'available'}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            borderRadius: 10,
                            background:
                              listing.status === 'available'
                                ? 'linear-gradient(135deg, #10B981, #059669)'
                                : 'var(--color-slate-200)',
                            color: listing.status === 'available' ? 'white' : 'var(--color-slate-500)',
                            fontWeight: 600,
                            fontSize: 14,
                            border: 'none',
                            cursor: listing.status === 'available' ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <MessageSquare size={16} />
                          <span>
                            {listing.status === 'available'
                              ? 'Request Hardware'
                              : listing.status === 'requested'
                              ? 'Request Pending'
                              : 'Already Taken'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Hardware Modal */}
      {isPostModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '28px',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--color-slate-900)' }}>
                Post Hardware to Community
              </h3>
              <button
                onClick={() => setIsPostModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-red-700)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 16,
                  display: 'flex',
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing}>
              {/* Type Switcher */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Item Category
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('component');
                      setFormDeviceClass('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      border: formType === 'component' ? '2px solid var(--color-green-600)' : '1px solid var(--surface-border)',
                      background: formType === 'component' ? 'rgba(16, 185, 129, 0.08)' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Component / Part
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('device');
                      setFormDeviceClass('B');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                      border: formType === 'device' ? '2px solid var(--color-green-600)' : '1px solid var(--surface-border)',
                      background: formType === 'device' ? 'rgba(16, 185, 129, 0.08)' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Complete Device
                  </button>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Listing Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Working Arduino Uno or Old Laptop with good LCD"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--surface-border)',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Item Selection */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  {formType === 'device' ? 'Recognized Device Model' : 'Component Name'}
                </label>
                <input
                  type="text"
                  list="item-catalog"
                  placeholder={formType === 'device' ? 'e.g. Old Laptop, DVD Player' : 'e.g. Ultrasonic Sensor, DC Motor'}
                  value={formItemName}
                  onChange={e => setFormItemName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--surface-border)',
                    fontSize: 14,
                  }}
                />
                <datalist id="item-catalog">
                  {formType === 'device'
                    ? (devicesData as { name: string }[]).map(d => <option key={d.name} value={d.name} />)
                    : (componentsData as { name: string }[]).map(c => <option key={c.name} value={c.name} />)}
                </datalist>
              </div>

              {/* Device Class Selector with CLASS E BLOCKED */}
              {formType === 'device' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Device Condition Class
                  </label>
                  <select
                    value={formDeviceClass}
                    onChange={e => setFormDeviceClass(e.target.value as DeviceClass)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border:
                        formDeviceClass === 'E'
                          ? '2px solid var(--color-red-600)'
                          : '1px solid var(--surface-border)',
                      fontSize: 14,
                      background: 'white',
                    }}
                  >
                    <option value="A">Class A – Direct Reuse (Tested & Working)</option>
                    <option value="B">Class B – Refurbish / Clean</option>
                    <option value="C">Class C – Repairable Component Failure</option>
                    <option value="D">Class D – Teardown & Harvest Parts</option>
                    <option value="E">Class E – Unsafe / Recycle Only (BLOCKED)</option>
                  </select>

                  {formDeviceClass === 'E' && (
                    <div
                      style={{
                        color: 'var(--color-red-600)',
                        fontSize: 12,
                        marginTop: 6,
                        fontWeight: 600,
                      }}
                    >
                      ⛔ Class E items are hazardous e-waste and cannot be posted on the community board!
                    </div>
                  )}
                </div>
              )}

              {/* Quantity & Offer Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={e => setFormQuantity(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--surface-border)',
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                    Offer Type
                  </label>
                  <select
                    value={formOfferType}
                    onChange={e => setFormOfferType(e.target.value as OfferType)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--surface-border)',
                      fontSize: 14,
                      background: 'white',
                    }}
                  >
                    <option value="free">Free Giveaway</option>
                    <option value="swap">Hardware Swap</option>
                    <option value="donate">Donation</option>
                  </select>
                </div>
              </div>

              {/* Area */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Pickup Area / Neighborhood
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chennai - Adyar, Coimbatore - RS Puram"
                  value={formArea}
                  onChange={e => setFormArea(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--surface-border)',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Optional Photo URL */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or hardware photo URL"
                  value={formPhotoUrl}
                  onChange={e => setFormPhotoUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--surface-border)',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formType === 'device' && formDeviceClass === 'E'}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  background:
                    formType === 'device' && formDeviceClass === 'E'
                      ? 'var(--color-slate-300)'
                      : 'var(--color-green-600)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: formType === 'device' && formDeviceClass === 'E' ? 'not-allowed' : 'pointer',
                }}
              >
                Publish Listing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hardware Request Modal */}
      {requestTargetListing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '24px 28px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-slate-900)' }}>
                Request Hardware: {requestTargetListing.title}
              </h3>
              <button
                onClick={() => setRequestTargetListing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-slate-400)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Send a polite message explaining what you are building. Your contact details will only be
              revealed if the owner accepts your request.
            </p>

            <textarea
              rows={4}
              placeholder="Hi! I am building a circular obstacle-avoidance robot for my college project and would love to pick up this sensor..."
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 10,
                border: '1px solid var(--surface-border)',
                fontSize: 14,
                marginBottom: 20,
                resize: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setRequestTargetListing(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'var(--color-slate-100)',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submittingRequest || !requestMessage.trim()}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: 10,
                  background: 'var(--color-green-600)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  cursor: submittingRequest || !requestMessage.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
