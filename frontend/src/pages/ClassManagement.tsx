import { socketService } from '../services/socketService';
import { notify } from '../components/Feedback';
import Modal from '../components/Modal';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Megaphone, Calendar, MessageSquare, CheckSquare, DollarSign, Users, Plus, Send, CheckCircle2, X, Loader2, Star, Edit, Trash2 } from 'lucide-react';
import { classManagementService, classService } from '../services/dataServices';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

type Tab = 'announcements' | 'schedule' | 'chat' | 'attendance' | 'payments' | 'members' | 'reviews';

export default function ClassManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useRole();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('announcements');
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ title: '', announcements: [], schedule: [], chat: [], students: [] });
  const [chatInput, setChatInput] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ text: '' });
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ date: '', day: 'Monday', startTime: '18:00', endTime: '19:00', topic: '' });
  const [scheduleError, setScheduleError] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get('tab');
    const tabParam = (raw === 'group-chat' ? 'chat' : raw) as Tab;
    if (tabParam && ['announcements', 'schedule', 'chat', 'attendance', 'payments', 'members', 'reviews'].includes(tabParam)) setActiveTab(tabParam);
    else setActiveTab('announcements');
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, reviewsRes] = await Promise.all([
          classManagementService.getClassManagement(id!),
          classService.getReviews(id!)
        ]);
        setData(res.data);
        setReviews(reviewsRes.data);
      } catch (error: any) { setLoadError(error.message || 'Unable to load class'); }
      finally { setLoading(false); }
    };
    if (id) fetchData();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewForm.text.trim()) {
      setReviewError('Review text is required');
      return;
    }
    setSubmittingReview(true);
    try {
      if (editingReview) {
        const res = await classService.updateReview(id!, editingReview._id, reviewForm);
        setReviews(reviews.map(r => r._id === editingReview._id ? res.data : r));
        setEditingReview(null);
      } else {
        const res = await classService.addReview(id!, reviewForm);
        setReviews([res.data, ...reviews]);
      }
      setReviewForm({ rating: 5, text: '' });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.message || 'Error saving review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingReviewId) return;
    try {
      await classService.deleteReview(id!, deletingReviewId);
      setReviews(reviews.filter(r => r._id !== deletingReviewId));
      setDeletingReviewId(null);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.message || 'Error deleting review');
      setDeletingReviewId(null);
    }
  };

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.text.trim()) return;
    setSubmittingAnnouncement(true);
    try {
      if (editingAnnouncement) {
        const res = await classManagementService.updateAnnouncement(id!, editingAnnouncement.id || editingAnnouncement._id, announcementForm.text);
        setData((prev: any) => ({
          ...prev,
          announcements: prev.announcements.map((a: any) => 
            (a.id || a._id) === (editingAnnouncement.id || editingAnnouncement._id) ? res.data : a
          )
        }));
      } else {
        const res = await classManagementService.createAnnouncement(id!, announcementForm.text);
        setData((prev: any) => ({
          ...prev,
          announcements: [res.data, ...prev.announcements]
        }));
      }
      setAnnouncementForm({ text: '' });
      setEditingAnnouncement(null);
      setShowAnnouncementModal(false);
    } catch (err: any) {
      notify(err.message || 'Error saving announcement');
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncementId) return;
    try {
      await classManagementService.deleteAnnouncement(id!, deletingAnnouncementId);
      setData((prev: any) => ({
        ...prev,
        announcements: prev.announcements.filter((a: any) => (a.id || a._id) !== deletingAnnouncementId)
      }));
      setDeletingAnnouncementId(null);
    } catch (err: any) {
      notify(err.message || 'Error deleting announcement');
      setDeletingAnnouncementId(null);
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingSchedule) return;
    if (!scheduleForm.date || scheduleForm.endTime <= scheduleForm.startTime) { setScheduleError('Choose a valid date and an end time after the start time'); return; }
    setScheduleError('');
    setSubmittingSchedule(true);
    const timeString = `${scheduleForm.startTime} - ${scheduleForm.endTime}`;
    const payload = {
      ...scheduleForm,
      time: timeString
    };
    try {
      if (editingSchedule) {
        const res = await classManagementService.updateSession(id!, editingSchedule.id || editingSchedule._id, payload);
        setData((prev: any) => ({
          ...prev,
          schedule: prev.schedule.map((s: any) => 
            (s.id || s._id) === (editingSchedule.id || editingSchedule._id) ? {
              id: res.data.id || res.data._id,
              date: res.data.date,
              day: res.data.day,
              time: res.data.time,
              startTime: res.data.startTime,
              endTime: res.data.endTime,
              topic: res.data.topic,
            } : s
          )
        }));
      } else {
        const res = await classManagementService.addSession(id!, payload);
        setData((prev: any) => ({
          ...prev,
          schedule: [...prev.schedule, {
            id: res.data.id || res.data._id,
            date: res.data.date,
            day: res.data.day,
            time: res.data.time,
            startTime: res.data.startTime,
            endTime: res.data.endTime,
            topic: res.data.topic,
          }]
        }));
      }
      setScheduleForm({ date: '', day: 'Monday', startTime: '18:00', endTime: '19:00', topic: '' });
      setEditingSchedule(null);
      setShowScheduleModal(false);
      notify("Session saved successfully");
    } catch (err: any) {
      setScheduleError(err.message || 'Error saving session');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSessionId) return;
    try {
      await classManagementService.deleteSession(id!, deletingSessionId);
      setData((prev: any) => ({
        ...prev,
        schedule: prev.schedule.filter((s: any) => (s.id || s._id) !== deletingSessionId)
      }));
      setDeletingSessionId(null);
    } catch (err: any) {
      notify(err.message || 'Error deleting session');
      setDeletingSessionId(null);
    }
  };

  const handleSaveAttendance = async () => {
    if (savingAttendance) return;
    const records = Object.entries(attendanceState).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) { notify(data.students.length ? 'Select attendance for at least one student' : 'No students to mark attendance for'); return; }
    setSavingAttendance(true);
    try {
      await classManagementService.markAttendance(id!, records);
      const updated = await classManagementService.getClassManagement(id!);
      setData(updated.data);
      setIsMarkingAttendance(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) { notify(err instanceof Error ? err.message : 'Error saving attendance'); } finally { setSavingAttendance(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await classManagementService.sendMessage(id!, chatInput);
      setData((prev: any) => ({ ...prev, chat: [...prev.chat, res.data] }));
      setChatInput('');
    } catch (err) { notify(err instanceof Error ? err.message : 'Error sending message'); } finally { setSending(false); }
  };

  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviteError, setInviteError] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [sending, setSending] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [deletingClass, setDeletingClass] = useState(false);
  const closeSchedule = () => { setShowScheduleModal(false); setEditingSchedule(null); };
  const handleInvite = async () => {
    if (inviting) return;
    if (!inviteForm.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email)) { setInviteError('Student name and a valid email are required'); return; }
    setInviteError(''); setInviting(true);
    try { await classManagementService.inviteStudent(id!, inviteForm); setShowAddStudent(false); setInviteForm({ name: '', email: '' }); notify('In-app invitation sent'); }
    catch (err: any) { setInviteError(err.message || 'Unable to invite student'); }
    finally { setInviting(false); }
  };
  const handleReminders = async () => {
    if (reminding) return;
    setReminding(true);
    try { const res = await classManagementService.sendReminders(id!); notify(res.message); }
    catch (err: any) { notify(err.message || 'Unable to send reminders'); }
    finally { setReminding(false); }
  };
  const handleDeleteClass = async () => {
    if (deletingClass || !confirm(`Delete "${data.title}" and its sessions, members, announcements and chats? This cannot be undone.`)) return;
    setDeletingClass(true);
    try { await classService.deleteClass(id!); notify('Class deleted successfully'); navigate('/teacher', { replace: true }); }
    catch (err: any) { notify(err.message || 'Unable to delete class'); }
    finally { setDeletingClass(false); }
  };
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message for everyone?')) return;
    try { await classManagementService.deleteMessage(id!, messageId); setData((prev: any) => ({ ...prev, chat: prev.chat.filter((m: any) => m.id !== messageId) })); notify('Message deleted'); }
    catch (err: any) { notify(err.message || 'Unable to delete message'); }
  };
  useEffect(() => {
    if (activeTab !== 'chat' || !id) return;
    const socket = socketService.getSocket();
    const join = () => socket?.emit('joinRoom', id);
    const deleted = ({ id: messageId }: { id: string }) => setData((prev: any) => ({ ...prev, chat: prev.chat.filter((m: any) => m.id !== messageId) }));
    join(); socket?.on('connect', join); socket?.on('messageDeleted', deleted);
    const timer = window.setInterval(() => { classManagementService.getMessages(id).then(res => setData((prev: any) => ({ ...prev, chat: res.data }))).catch(() => {}); }, 5000);
    return () => { window.clearInterval(timer); socket?.emit('leaveRoom', id); socket?.off('connect', join); socket?.off('messageDeleted', deleted); };
  }, [id, activeTab]);
  const currentStudent = data.students?.find((student: any) => student.id === user?._id);
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'chat', label: 'Group Chat', icon: MessageSquare },
    { id: 'attendance', label: role === 'teacher' ? 'Attendance' : 'My Attendance', icon: CheckSquare },
    { id: 'payments', label: role === 'teacher' ? 'Payments' : 'My Payments', icon: DollarSign },
    { id: 'members', label: role === 'teacher' ? 'Members' : 'Classmates', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  if (loadError) return <p role="alert" className="p-8 text-red-600">{loadError}</p>;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 h-[calc(100vh-8rem)] flex flex-col relative">
      {data.teacherId === user?._id && <button disabled={deletingClass} onClick={handleDeleteClass} className="self-end text-red-600 p-2">Delete Class</button>}
      {showSuccess && (<div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">Attendance saved successfully!</span></div>)}
      {reviewSuccess && (<div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">Success!</span></div>)}

      {deletingReviewId && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-gray-900 mb-2">Delete Review</h3><p className="text-gray-500 mb-6">Are you sure you want to delete this review? This action cannot be undone.</p><div className="flex gap-3"><button onClick={() => setDeletingReviewId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button><button onClick={handleDeleteReview} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Delete</button></div></div></div>)}

      {editingReview && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Edit Review</h3><button onClick={() => { setEditingReview(null); setReviewForm({ rating: 5, text: '' }); setReviewError(''); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>{reviewError && (<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{reviewError}</div>)}<form onSubmit={handleSubmitReview} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Rating</label><div className="flex gap-2">{[1, 2, 3, 4, 5].map((star) => (<button type="button" key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className="focus:outline-none"><Star className={`h-8 w-8 ${reviewForm.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} /></button>))}</div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label><textarea rows={4} value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="What did you think of this class?" /></div><button type="submit" disabled={submittingReview} className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">{submittingReview && <Loader2 className="h-4 w-4 animate-spin" />} Save Changes</button></form></div></div>)}

      {showAddStudent && (<Modal label="Add student" onClose={() => setShowAddStudent(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Add New Student</h3><button onClick={() => setShowAddStudent(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label><input value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })} required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. John Doe" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} required type="email" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="john@example.com" /></div>{inviteError && <p role="alert" className="text-red-600">{inviteError}</p>}<button disabled={inviting} onClick={handleInvite} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">Send Invite</button></div></div></Modal>)}

      {selectedStudent && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">{selectedStudent.name.charAt(0)}</div><div><h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3><p className="text-sm text-gray-500">Joined {new Date(selectedStudent?.joinedAt || Date.now()).toLocaleDateString()}</p></div></div><button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><div className="space-y-4">{role === 'teacher' && (<><div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Attendance Rate</h4><p className="text-2xl font-bold text-gray-900">{selectedStudent.attendance}</p></div><div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h4><span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block mt-1 ${selectedStudent.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedStudent.paymentStatus}</span></div></>)}<div className="flex gap-3 pt-4"><button onClick={() => navigate(`/messages?userId=${selectedStudent.id}&name=${encodeURIComponent(selectedStudent.name)}`)} className="flex-1 bg-indigo-50 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-100 transition-colors">Message</button>{role === 'teacher' && (<button onClick={() => notify(`Attendance: ${selectedStudent.attendance}. Payment: ${selectedStudent.paymentStatus}.`)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">View Full Report</button>)}</div></div></div></div>)}

      {showScheduleModal && (<Modal label="Session" onClose={closeSchedule}><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">{editingSchedule ? 'Edit Session' : 'Add Session'}</h3><button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); setScheduleForm({ date: '', day: 'Monday', startTime: '18:00', endTime: '19:00', topic: '' }); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmitSchedule} className="space-y-4">{scheduleError && <p role="alert" className="text-red-600">{scheduleError}</p>}<div><label className="block text-sm font-medium text-gray-700 mb-1">Topic / Title (Optional)</label><input type="text" value={scheduleForm.topic} onChange={e => setScheduleForm({...scheduleForm, topic: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Batting Practice" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" required value={scheduleForm.date.slice(0, 10)} onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" required value={scheduleForm.startTime} onChange={e => setScheduleForm({...scheduleForm, startTime: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" required value={scheduleForm.endTime} onChange={e => setScheduleForm({...scheduleForm, endTime: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5" /></div></div><button type="submit" disabled={submittingSchedule} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors mt-2 disabled:opacity-50 flex justify-center items-center gap-2">{submittingSchedule && <Loader2 className="h-4 w-4 animate-spin" />} Save Session</button></form></div></Modal>)}
      
      {deletingSessionId && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-gray-900 mb-2">Delete Session</h3><p className="text-gray-500 mb-6">Are you sure you want to delete this session?</p><div className="flex gap-3"><button onClick={() => setDeletingSessionId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button><button onClick={handleDeleteSchedule} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Delete</button></div></div></div>)}

      {showAnnouncementModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">{editingAnnouncement ? 'Edit Announcement' : 'New Post'}</h3><button onClick={() => { setShowAnnouncementModal(false); setEditingAnnouncement(null); setAnnouncementForm({text: ''}); }} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmitAnnouncement} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Announcement Content</label><textarea rows={4} value={announcementForm.text} onChange={e => setAnnouncementForm({text: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Type your announcement here..." required /></div><button type="submit" disabled={submittingAnnouncement} className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">{submittingAnnouncement && <Loader2 className="h-4 w-4 animate-spin" />} {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}</button></form></div></div>)}

      {deletingAnnouncementId && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-gray-900 mb-2">Delete Announcement</h3><p className="text-gray-500 mb-6">Are you sure you want to delete this announcement?</p><div className="flex gap-3"><button onClick={() => setDeletingAnnouncementId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancel</button><button onClick={handleDeleteAnnouncement} className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">Delete</button></div></div></div>)}

      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"><ChevronLeft className="h-5 w-5 text-gray-600" /></button>
        <div><h1 className="text-2xl font-extrabold text-gray-900">{data.title}</h1><p className="text-sm text-gray-500">Class Management Dashboard</p></div>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-6 shrink-0">
        {tabs.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsMarkingAttendance(false); }} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />{tab.label}
          </button>); })}
      </div>

      <div className="flex-1 overflow-y-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {activeTab === 'announcements' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Recent Announcements</h2>{role === 'teacher' && (<button onClick={() => setShowAnnouncementModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> New Post</button>)}</div><div className="space-y-4">{data.announcements.length === 0 ? (<p className="text-gray-500 text-center py-8">No announcements yet.</p>) : data.announcements.map((ann: any) => (<div key={ann.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{ann.author?.charAt(0) || 'A'}</div><div><h4 className="font-bold text-gray-900">{ann.author}</h4><span className="text-xs text-gray-500">{ann.date}</span></div></div>{role === 'teacher' && (<div className="flex items-center gap-2"><button onClick={() => { setEditingAnnouncement(ann); setAnnouncementForm({text: ann.text}); setShowAnnouncementModal(true); }} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit className="h-4 w-4" /></button><button onClick={() => setDeletingAnnouncementId(ann.id || ann._id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button></div>)}</div><p className="text-gray-700 whitespace-pre-line">{ann.text}</p></div>))}</div></div>)}

        {activeTab === 'schedule' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>{role === 'teacher' && (<button onClick={() => { setEditingSchedule(null); setScheduleForm({ date: '', day: 'Monday', startTime: '18:00', endTime: '19:00', topic: '' }); setShowScheduleModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> Add Session</button>)}</div><div className="space-y-4">{data.schedule.length === 0 ? (<p className="text-gray-500 text-center py-8">No sessions scheduled.</p>) : data.schedule.map((session: any) => (<div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 transition-colors gap-4"><div className="flex items-center gap-4"><div className="flex flex-col items-center justify-center h-14 w-14 bg-indigo-50 rounded-xl text-indigo-600 shrink-0"><span className="text-xs font-bold uppercase">{session.day.substring(0, 3)}</span><span className="text-lg font-extrabold leading-none">{session.date ? new Date(session.date).getDate() : session.day.substring(0, 3)}</span></div><div><h4 className="font-bold text-gray-900">{session.topic || 'Class Session'}</h4><div className="flex items-center gap-2 text-sm text-gray-500 mt-1"><Calendar className="h-4 w-4" /> {session.date} • {session.startTime} - {session.endTime}</div></div></div>{role === 'teacher' && (<div className="flex gap-2 w-full sm:w-auto"><button onClick={() => { setEditingSchedule(session); setScheduleForm({ date: session.date || '', day: session.day || 'Monday', startTime: session.startTime || '18:00', endTime: session.endTime || '19:00', topic: session.topic || '' }); setShowScheduleModal(true); }} className="p-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"><Edit className="h-4 w-4" /></button><button onClick={() => setDeletingSessionId(session.id || session._id)} className="p-2 bg-white border border-gray-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></button></div>)}</div>))}</div></div>)}

        {activeTab === 'chat' && (<div className="flex flex-col h-full -m-6"><div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0"><div><h2 className="font-bold text-gray-900">{data.title} Group</h2><p className="text-xs text-gray-500">{`${data.students.length + 1} ${data.students.length === 0 ? "participant" : "participants"}`}</p></div>{role === 'teacher' && (<button onClick={async () => { try { const res = await classManagementService.setChatMuted(id!, !data.chatMuted); setData((prev: any) => ({ ...prev, chatMuted: res.data.muted })); } catch (err: any) { notify(err.message); } }} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">{data.chatMuted ? "Unmute Chat" : "Mute Chat"}</button>)}</div><div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">{data.chat.map((msg: any) => (<div key={msg.id} className={`flex flex-col ${msg.isTeacher ? 'items-end' : 'items-start'}`}><div className="flex items-baseline gap-2 mb-1"><span className="text-xs font-medium text-gray-500">{msg.sender}</span><span className="text-[10px] text-gray-400">{msg.time}</span></div><div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${msg.isTeacher ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}><p className="text-sm">{msg.text}</p>{(msg.senderId === user?._id || data.teacherId === user?._id) && <button aria-label="Delete message" onClick={() => handleDeleteMessage(msg.id)} className="text-xs underline mt-2">Delete</button>}</div></div>))}</div><div className="p-4 border-t border-gray-200 bg-white shrink-0"><div className="flex items-center gap-2"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full px-4 py-2.5 text-sm transition-all" /><button onClick={handleSendMessage} disabled={sending} className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shrink-0"><Send className="h-4 w-4" /></button></div></div></div>)}

        {activeTab === 'attendance' && (<div className="space-y-6">
          {role === 'student' ? (
            <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-2xl p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance Overview</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Attendance Rate</h4><p className="text-3xl font-bold text-gray-900">{currentStudent?.attendance || '0%'}</p></div><div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Classes Attended</h4><p className="text-3xl font-bold text-gray-900">{currentStudent?.attendedCount || 0} <span className="text-lg text-gray-500 font-medium">/ {currentStudent?.sessionCount || 0}</span></p></div></div></div></div>
          ) : isMarkingAttendance ? (
            <div className="animate-in fade-in"><div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-bold text-gray-900">Mark Attendance: Today</h2><p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p></div><button onClick={() => setIsMarkingAttendance(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button></div><div className="space-y-3 mb-8">{data.students.map((student: any) => (<div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl gap-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{student.name.charAt(0)}</div><span className="font-bold text-gray-900">{student.name}</span></div><div className="flex gap-2 w-full sm:w-auto"><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'present' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'present' ? 'bg-green-500 text-white border-green-500' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>Present</button><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'absent' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'absent' ? 'bg-red-500 text-white border-red-500' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>Absent</button><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'late' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'late' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'}`}>Late</button></div></div>))}</div><div className="flex justify-end"><button onClick={handleSaveAttendance} disabled={savingAttendance} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">Save Attendance</button></div></div>
          ) : (
            <><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Overall Attendance</h2><div className="flex items-center gap-3"><button onClick={() => setIsMarkingAttendance(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"><CheckSquare className="h-4 w-4" /> Mark Today</button></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 rounded-tl-lg">Student Name</th><th className="px-6 py-3">Attendance %</th><th className="px-6 py-3 rounded-tr-lg text-right">Action</th></tr></thead><tbody>{data.students.map((student: any, idx: number) => (<tr key={student.id} className={`bg-white ${idx !== data.students.length - 1 ? 'border-b border-gray-100' : ''}`}><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{student.name.charAt(0)}</div>{student.name}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]"><div className={`h-2.5 rounded-full ${parseInt(student.attendance) > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: student.attendance }}></div></div><span className="font-medium text-gray-700">{student.attendance}</span></div></td><td className="px-6 py-4 text-right"><button onClick={() => setSelectedStudent(student)} className="font-medium text-indigo-600 hover:text-indigo-800">View Details</button></td></tr>))}</tbody></table></div></>
          )}</div>)}

        {activeTab === 'payments' && (<div className="space-y-6">
          {role === 'student' ? (
            <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-2xl p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">My Fee Status</h2><div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><p className="text-sm text-gray-500 font-medium mb-1">Current Month</p><p className="text-3xl font-bold text-gray-900">₹{data.price}</p></div><span className={`px-4 py-1.5 rounded-full text-sm font-bold ${currentStudent?.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{currentStudent?.paymentStatus || 'Pending'}</span></div></div></div>
          ) : (
            <><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Fee Status</h2><button disabled={reminding} onClick={handleReminders} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors">Send Reminders</button></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 rounded-tl-lg">Student Name</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 rounded-tr-lg text-right">Action</th></tr></thead><tbody>{data.students.map((student: any, idx: number) => (<tr key={student.id} className={`bg-white ${idx !== data.students.length - 1 ? 'border-b border-gray-100' : ''}`}><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td><td className="px-6 py-4 font-medium text-gray-900">₹{data.price}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{student.paymentStatus}</span></td><td className="px-6 py-4 text-right">{student.paymentStatus === 'Pending' ? (<button disabled={reminding} onClick={handleReminders} className="font-medium text-indigo-600 hover:text-indigo-800">Remind all</button>) : (<span className="text-gray-500">{student.paymentStatus}</span>)}</td></tr>))}</tbody></table></div></>
          )}</div>)}

        {activeTab === 'members' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Class Members ({data.students.length})</h2>{role === 'teacher' && (<button onClick={() => setShowAddStudent(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> Add Student</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.students.map((student: any) => (<div key={student.id} onClick={() => role === 'teacher' ? setSelectedStudent(student) : null} className={`flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl transition-colors ${role === 'teacher' ? 'hover:border-indigo-300 cursor-pointer' : ''}`}><div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">{student.name.charAt(0)}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate">{student.name}</h4><p className="text-sm text-gray-500 truncate">Joined {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString() : "date unavailable"}</p></div><button onClick={(e) => { e.stopPropagation(); navigate(`/messages?userId=${student.id}&name=${encodeURIComponent(student.name)}`); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"><MessageSquare className="h-4 w-4" /></button></div>))}</div></div>)}

        {activeTab === 'reviews' && (<div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Class Reviews</h2>
          </div>
          
          {role === 'student' && !reviews.some(r => r.student === (user as any)?._id || r.student === (user as any)?.id) && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Write a Review</h3>
              {reviewError && (<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{reviewError}</div>)}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button type="button" key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className="focus:outline-none">
                        <Star className={`h-8 w-8 ${reviewForm.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea rows={4} value={reviewForm.text} onChange={e => setReviewForm({...reviewForm, text: e.target.value})} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="What did you think of this class?" />
                </div>
                <button type="submit" disabled={submittingReview} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {submittingReview && <Loader2 className="h-4 w-4 animate-spin" />} Submit Review
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet for this class.</p>
            ) : (
              reviews.map((review: any) => (
                <div key={review._id} className="p-6 bg-white border border-gray-200 rounded-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {review.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{review.studentName}</h4>
                        <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${review.rating >= star ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      {role === 'student' && (review.student === (user as any)?._id || review.student === (user as any)?.id) && (
                        <div className="flex gap-3 mt-1">
                          <button onClick={() => { setEditingReview(review); setReviewForm({ rating: review.rating, text: review.text }); }} className="text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setDeletingReviewId(review._id)} className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 text-sm"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                </div>
              ))
            )}
          </div>
        </div>)}
      </div>
    </div>
  );
}
