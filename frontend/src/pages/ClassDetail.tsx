import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Calendar, Clock, Users, Award, ShieldCheck, ChevronLeft, MessageCircle, Heart, Bell, Loader2 } from 'lucide-react';
import { classService } from '../services/dataServices';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { role } = useRole();

  const [cls, setCls] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [joinStatus, setJoinStatus] = useState<string>('none');
  const [trialStatus, setTrialStatus] = useState<string>('none');
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [selectedTrialSlot, setSelectedTrialSlot] = useState('');
  const [bookingTrial, setBookingTrial] = useState(false);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await classService.getClassById(id!);
        setCls(res.data);
        setTeacher(res.data.teacher);
        
        if (isAuthenticated && role === 'student') {
          try {
            const [statusRes, trialStatusRes] = await Promise.all([
              classService.getJoinStatus(id!).catch(() => ({ data: { status: 'none' } })),
              classService.getTrialStatus(id!).catch(() => ({ data: { status: 'none' } }))
            ]);
            setJoinStatus(statusRes.data.status);
            setTrialStatus(trialStatusRes.data?.status || 'none');
          } catch (e) {
            console.error('Error fetching statuses:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching class:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClass();
  }, [id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (joinStatus !== 'none') return;

    setEnrolling(true);
    try {
      await classService.joinRequest(id!);
      setJoinStatus('pending');
      alert('Join request sent successfully! Pending teacher approval.');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to send request');
    } finally {
      setEnrolling(false);
    }
  };

  const handleBookTrial = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingTrial(true);
    try {
      await classService.bookTrial(id!, { selectedSlot: selectedTrialSlot });
      setTrialStatus('pending');
      setShowTrialModal(false);
      alert('Trial request sent successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to book trial');
    } finally {
      setBookingTrial(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!cls || !teacher) {
    return <div className="text-center py-20 text-gray-500">Class not found</div>;
  }

  const isSaved = isFavorite(cls._id || cls.id);
  const reviews = cls.reviews || [];
  const announcements = cls.announcements || [];

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to results
      </button>

      {/* Hero Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 h-64 md:h-96 rounded-2xl overflow-hidden">
        <img src={cls.photos?.[0]} alt={cls.title} className="w-full h-full object-cover" />
        <div className="hidden md:grid grid-rows-2 gap-4 h-full">
          <img src={cls.photos?.[1] || 'https://picsum.photos/seed/placeholder/600/400'} alt="Gallery" className="w-full h-full object-cover" />
          <div className="bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
            +3 more photos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{cls.title}</h1>
              <button 
                onClick={() => toggleFavorite(cls._id || cls.id)}
                className={`p-2 rounded-full ${isSaved ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <Heart className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
            <p className="text-xl text-indigo-600 font-medium mb-4">{cls.academyName}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1 font-medium text-gray-900">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                {cls.rating} <span className="text-gray-500 font-normal">({reviews.length} reviews)</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-5 w-5 text-gray-400" />
                {cls.distance} away
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Users className="h-5 w-5 text-gray-400" />
                {cls.studentsCount}/{cls.maxStudents} enrolled
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Teacher Info */}
          <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-4 -mx-4 rounded-xl transition-colors" onClick={() => navigate(`/teacher/${teacher.id}`)}>
            <div className="flex items-center gap-4">
              <img src={teacher.photo} alt={teacher.name} className="h-16 w-16 rounded-full object-cover" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Hosted by {teacher.name}</h3>
                <p className="text-sm text-gray-500">{teacher.experience} experience • {teacher.skills?.join(', ')}</p>
              </div>
            </div>
            <ChevronLeft className="h-5 w-5 text-gray-400 rotate-180" />
          </div>

          <hr className="border-gray-200" />

          {/* About */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this class</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{cls.description}</p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-2xl">
            <div className="flex items-start gap-3">
              <Calendar className="h-6 w-6 text-indigo-600 mt-0.5" />
              <div><h4 className="font-semibold text-gray-900">Schedule</h4><p className="text-sm text-gray-600">{cls.schedule}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-6 w-6 text-indigo-600 mt-0.5" />
              <div><h4 className="font-semibold text-gray-900">Timing</h4><p className="text-sm text-gray-600">{cls.time}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-6 w-6 text-indigo-600 mt-0.5" />
              <div><h4 className="font-semibold text-gray-900">Age Group</h4><p className="text-sm text-gray-600">{cls.ageGroup}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-6 w-6 text-indigo-600 mt-0.5" />
              <div><h4 className="font-semibold text-gray-900">Skill Level</h4><p className="text-sm text-gray-600">{cls.skillLevel}</p></div>
            </div>
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-6 w-6 text-indigo-600" /> Important Updates
              </h2>
              <div className="space-y-4">
                {announcements.map((announcement: any) => (
                  <div key={announcement.id || announcement._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900">{announcement.authorName || announcement.author}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{announcement.date}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">{announcement.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-current" />
                {cls.rating} ({reviews.length} reviews)
              </h2>
            </div>
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div key={review._id || review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                      {review.studentName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.studentName}</h4>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-3xl font-extrabold text-gray-900">₹{cls.price}</span>
                <span className="text-gray-500 font-medium"> / {cls.priceUnit}</span>
              </div>
            </div>

            {cls.pricingTiers && (
              <div className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900">Dynamic Pricing Tiers</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex justify-between items-center ${cls.pricingTiers.currentEnrolled < 50 ? 'text-green-600 font-bold' : 'text-gray-500 line-through'}`}>
                    <span>First 50 Students</span><span>₹{cls.pricingTiers.first50}</span>
                  </div>
                  <div className={`flex justify-between items-center ${cls.pricingTiers.currentEnrolled >= 50 && cls.pricingTiers.currentEnrolled < 150 ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                    <span>Next 100 Students</span><span>₹{cls.pricingTiers.next100}</span>
                  </div>
                  <div className={`flex justify-between items-center ${cls.pricingTiers.currentEnrolled >= 150 ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
                    <span>Standard Rate</span><span>₹{cls.pricingTiers.standard}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-indigo-600 font-medium text-center">
                    {cls.pricingTiers.currentEnrolled} students already enrolled!
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleEnroll}
                disabled={enrolling || joinStatus === 'pending' || joinStatus === 'rejected' || joinStatus === 'enrolled' || role === 'teacher'}
                className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {role === 'teacher' ? 'Teachers Cannot Join' :
                 enrolling ? 'Sending Request...' : 
                 joinStatus === 'enrolled' ? 'Enrolled' :
                 joinStatus === 'pending' ? 'Request Pending' :
                 joinStatus === 'rejected' ? 'Request Rejected' :
                 'Request to Join'}
              </button>
              
              {cls.trialAvailable && (
                <button 
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else setShowTrialModal(true);
                  }}
                  disabled={trialStatus === 'pending' || trialStatus === 'accepted' || role === 'teacher'}
                  className="w-full bg-white border-2 border-indigo-600 text-indigo-600 font-bold text-lg py-3.5 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {trialStatus === 'pending' ? 'Trial Requested' : trialStatus === 'accepted' ? 'Trial Accepted' : `Book Trial for ₹${cls.trialPrice || 0}`}
                </button>
              )}
              
              <button className="w-full flex items-center justify-center gap-2 text-gray-700 font-medium py-3 hover:bg-gray-50 rounded-xl transition-colors">
                <MessageCircle className="h-5 w-5" /> Contact Teacher
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">Verified teacher with background check completed.</p>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">Only {cls.maxStudents - cls.studentsCount} spots left in this batch.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTrialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md my-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Book a Trial Class</h2>
            <p className="text-gray-600 mb-6">Select a slot that works for you. The teacher will confirm your request.</p>
            
            <div className="space-y-3 mb-6">
              {cls.trialSlots?.map((slot: string) => (
                <label key={slot} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${selectedTrialSlot === slot ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <input type="radio" name="trialSlot" value={slot} checked={selectedTrialSlot === slot} onChange={() => setSelectedTrialSlot(slot)} className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="ml-3 font-medium text-gray-900">{slot}</span>
                </label>
              ))}
              {(!cls.trialSlots || cls.trialSlots.length === 0) && (
                <p className="text-gray-500 italic">No specific slots defined. Request a trial and the teacher will contact you.</p>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowTrialModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
              <button onClick={handleBookTrial} disabled={bookingTrial || (cls.trialSlots?.length > 0 && !selectedTrialSlot)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
                {bookingTrial ? 'Requesting...' : 'Request Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
