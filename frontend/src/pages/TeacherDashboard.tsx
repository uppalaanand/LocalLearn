import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, DollarSign, MessageSquare, Plus, ChevronRight, Settings, Loader2, BookOpen, Check, X } from 'lucide-react';
import { teacherDashService, classService, teacherService } from '../services/dataServices';
import { useAuth } from '../context/AuthContext';

type TeacherTab = 'overview' | 'create' | 'profile' | 'requests';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('overview');
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({ title: '', description: '', category: 'sports', price: 2000, schedule: '', time: '', ageGroup: '', skillLevel: 'All Levels', maxStudents: 50, trialAvailable: false, trialPrice: 0, trialSlots: '' });
  const [newClassPhotos, setNewClassPhotos] = useState<File[]>([]);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', experience: '', skills: '', certifications: '', about: '', location: '' });
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [trialRequests, setTrialRequests] = useState<any[]>([]);
  
  const [editingClassData, setEditingClassData] = useState<any>(null);
  const [editClassPhotos, setEditClassPhotos] = useState<File[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingClass, setSavingClass] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, reqsRes, trialsRes] = await Promise.all([
          teacherDashService.getDashboard(),
          teacherDashService.getJoinRequests(),
          teacherDashService.getTrialRequests().catch(() => ({ data: [] }))
        ]);
        setDashData(dashRes.data);
        setJoinRequests(reqsRes.data);
        setTrialRequests(trialsRes.data);
        if (user) setProfileData(p => ({ ...p, name: user.name, email: user.email, phone: user.phone || '' }));
      } catch (error) { console.error('Error:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const formData = new FormData();
      Object.entries(newClass).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      newClassPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
      await classService.createClass(formData);
      alert('Class created successfully!');
      setActiveTab('overview');
      const res = await teacherDashService.getDashboard();
      setDashData(res.data);
    } catch (err: any) { alert(err.message || 'Failed to create class'); }
    finally { setCreating(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teacherService.updateProfile({
        ...profileData,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(Boolean),
        certifications: profileData.certifications.split(',').map(s => s.trim()).filter(Boolean),
      });
      alert('Profile updated!');
    } catch (err: any) { alert(err.message || 'Failed to update'); }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await teacherDashService.acceptJoinRequest(id);
      setJoinRequests(prev => prev.filter(r => r.id !== id));
      alert('Request accepted!');
      const dashRes = await teacherDashService.getDashboard();
      setDashData(dashRes.data);
    } catch (err: any) { alert(err.message || 'Failed to accept'); }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await teacherDashService.rejectJoinRequest(id);
      setJoinRequests(prev => prev.filter(r => r.id !== id));
      alert('Request rejected');
    } catch (err: any) { alert(err.message || 'Failed to reject'); }
  };

  const handleAcceptTrial = async (id: string) => {
    try {
      await teacherDashService.acceptTrialRequest(id);
      setTrialRequests(prev => prev.filter(r => (r.id || r._id) !== id));
      alert('Trial Request accepted!');
    } catch (err: any) { alert(err.message || 'Failed to accept'); }
  };

  const handleRejectTrial = async (id: string) => {
    try {
      await teacherDashService.rejectTrialRequest(id);
      setTrialRequests(prev => prev.filter(r => (r.id || r._id) !== id));
      alert('Trial Request rejected');
    } catch (err: any) { alert(err.message || 'Failed to reject'); }
  };

  const handleOpenEditClass = async (classId: string) => {
    try {
      const res = await classService.getClassById(classId);
      const data = res.data;
      if (Array.isArray(data.trialSlots)) {
        data.trialSlots = data.trialSlots.join(', ');
      }
      setEditingClassData(data);
      setEditClassPhotos([]);
      setShowEditModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch class details');
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClass(true);
    try {
      const formData = new FormData();
      Object.entries(editingClassData).forEach(([key, value]) => {
        if (key === 'photos') return;
        if (value !== null && value !== undefined) {
          formData.append(key, (value as any).toString());
        }
      });
      editClassPhotos.forEach(photo => {
        formData.append('photos', photo);
      });
      await classService.updateClass(editingClassData.id || editingClassData._id, formData);
      alert('Class updated successfully!');
      setShowEditModal(false);
      const res = await teacherDashService.getDashboard();
      setDashData(res.data);
    } catch (err: any) {
      alert(err.message || 'Failed to update class');
    } finally {
      setSavingClass(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  const stats = dashData?.stats || {};
  const activeClasses = dashData?.activeClasses || [];
  const recentMessages = dashData?.recentMessages || [];

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {user?.name || 'Teacher'}</p>
        </div>
        <button onClick={() => setActiveTab('create')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Post New Class
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-8">
        {[
          { id: 'overview' as TeacherTab, label: 'Overview', icon: BarChart3 },
          { id: 'requests' as TeacherTab, label: `Requests (${joinRequests.length + trialRequests.filter(r => r.status === 'pending').length})`, icon: Users },
          { id: 'create' as TeacherTab, label: 'Create Class', icon: Plus },
          { id: 'profile' as TeacherTab, label: 'My Profile', icon: Settings },
        ].map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />{tab.label}
          </button>); })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-indigo-50 rounded-lg"><Users className="h-5 w-5 text-indigo-600" /></div><span className="text-sm text-gray-500">Total Students</span></div><p className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</p></div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-green-50 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div><span className="text-sm text-gray-500">Revenue</span></div><p className="text-2xl font-bold text-gray-900">₹{stats.revenue || 0}</p></div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-yellow-50 rounded-lg"><BookOpen className="h-5 w-5 text-yellow-600" /></div><span className="text-sm text-gray-500">Classes</span></div><p className="text-2xl font-bold text-gray-900">{activeClasses.length}</p></div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-3 mb-3"><div className="p-2 bg-blue-50 rounded-lg"><MessageSquare className="h-5 w-5 text-blue-600" /></div><span className="text-sm text-gray-500">Messages</span></div><p className="text-2xl font-bold text-gray-900">{stats.unreadMessages || 0}</p></div>
          </div>

          <div><h2 className="text-xl font-bold text-gray-900 mb-4">Active Classes</h2>
            <div className="space-y-4">
              {activeClasses.map((cls: any) => (
                <div key={cls.classId} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center" onClick={() => navigate(`/class-management/${cls.classId}`)}>
                  <div><h3 className="text-lg font-bold text-gray-900">{cls.title}</h3><p className="text-sm text-gray-500">{cls.studentsCount} students • Next: {cls.nextSession}</p></div>
                  <div className="flex items-center gap-4">
                    {cls.pendingPayments > 0 && <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">{cls.pendingPayments} pending payments</span>}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleOpenEditClass(cls.classId); 
                      }} 
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>))}
              {activeClasses.length === 0 && <p className="text-gray-500 text-center py-8">No active classes. Create one to get started!</p>}
            </div>
          </div>

          {recentMessages.length > 0 && (
            <div><h2 className="text-xl font-bold text-gray-900 mb-4">Recent Messages</h2>
              <div className="space-y-3">
                {recentMessages.map((msg: any) => (
                  <div key={msg.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">{msg.from?.charAt(0)}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-gray-900">{msg.from}</p><p className="text-sm text-gray-500 truncate">{msg.text}</p></div>
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  </div>))}
              </div>
            </div>)}
        </div>)}

      {activeTab === 'requests' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Pending Join Requests</h2>
          </div>
          
          {joinRequests.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No pending requests</h3>
              <p className="text-gray-500 mt-2">You're all caught up! When students request to join your classes, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {joinRequests.map(req => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img src={req.studentAvatar || 'https://i.pravatar.cc/150'} alt={req.studentName} className="h-14 w-14 rounded-full object-cover bg-gray-100" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{req.studentName}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Wants to join: <span className="text-indigo-600">{req.className}</span></p>
                      <p className="text-xs text-gray-400 mt-1">Requested on {new Date(req.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleRejectRequest(req.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors">
                      <X className="h-4 w-4" /> Reject
                    </button>
                    <button onClick={() => handleAcceptRequest(req.id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                      <Check className="h-4 w-4" /> Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Trial Requests</h2>
          
          {trialRequests.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No trial requests</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {/* {console.log(trialRequests)} */}
              {trialRequests.map(req => (
                <div key={req.id || req._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <img src={req.student?.avatar || req.studentAvatar || 'https://i.pravatar.cc/150'} alt={req.student?.name || req.studentName} className="h-14 w-14 rounded-full object-cover bg-gray-100" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{req.student?.name || req.studentName}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-0.5">Trial for: <span className="text-indigo-600">{req.class?.title || req.className}</span></p>
                      <p className="text-sm text-gray-700 font-medium mt-0.5">Requested Slot: <span className="font-bold">{req.selectedSlot}</span></p>
                      <p className="text-xs text-gray-400 mt-1">Requested on {new Date(req.createdAt || req.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {req.status === 'pending' ? (
                      <>
                        <button onClick={() => handleRejectTrial(req.id || req._id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors">
                          <X className="h-4 w-4" /> Reject
                        </button>
                        <button onClick={() => handleAcceptTrial(req.id || req._id)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors">
                          <Check className="h-4 w-4" /> Accept
                        </button>
                      </>
                    ) : (
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${req.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {req.status === 'accepted' ? 'Accepted' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Class</h2>
          <form onSubmit={handleCreateClass} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Class Title *</label><input type="text" required value={newClass.title} onChange={e => setNewClass({...newClass, title: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Beginner Cricket Coaching" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea required value={newClass.description} onChange={e => setNewClass({...newClass, description: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe your class..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={newClass.category} onChange={e => setNewClass({...newClass, category: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3"><option value="sports">Sports</option><option value="dance">Dance</option><option value="music">Music</option><option value="academics">Academics</option><option value="fitness">Fitness</option><option value="coding">Coding</option><option value="arts">Arts</option><option value="languages">Languages</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹/month) *</label><input type="number" required min={0} value={newClass.price} onChange={e => setNewClass({...newClass, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label><input type="text" value={newClass.schedule} onChange={e => setNewClass({...newClass, schedule: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. Mon, Wed, Fri" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="text" value={newClass.time} onChange={e => setNewClass({...newClass, time: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. 5:00 PM - 6:30 PM" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label><input type="text" value={newClass.ageGroup} onChange={e => setNewClass({...newClass, ageGroup: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. 10-15 years" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label><select value={newClass.skillLevel} onChange={e => setNewClass({...newClass, skillLevel: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select></div>
            </div>
            
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={newClass.trialAvailable} onChange={e => setNewClass({...newClass, trialAvailable: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                <span className="text-sm font-bold text-indigo-900">Offer Trial Classes</span>
              </label>
              {newClass.trialAvailable && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-indigo-900 mb-1">Trial Price (₹)</label><input type="number" min={0} value={newClass.trialPrice} onChange={e => setNewClass({...newClass, trialPrice: Number(e.target.value)})} className="w-full border border-indigo-200 rounded-xl px-4 py-3" placeholder="0 for free" /></div>
                  <div><label className="block text-sm font-medium text-indigo-900 mb-1">Trial Slots (comma separated)</label><input type="text" value={newClass.trialSlots} onChange={e => setNewClass({...newClass, trialSlots: e.target.value})} className="w-full border border-indigo-200 rounded-xl px-4 py-3" placeholder="e.g. Sat 10AM, Sun 11AM" /></div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Photos</label>
              <input type="file" multiple accept="image/*" onChange={e => {
                if (e.target.files) setNewClassPhotos(Array.from(e.target.files));
              }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>

            <button type="submit" disabled={creating} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">{creating ? 'Creating...' : 'Create Class'}</button>
          </form>
        </div>)}

      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Experience</label><input type="text" value={profileData.experience} onChange={e => setProfileData({...profileData, experience: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. 8 years" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label><input type="text" value={profileData.skills} onChange={e => setProfileData({...profileData, skills: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. Cricket, Fitness" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Certifications (comma separated)</label><input type="text" value={profileData.certifications} onChange={e => setProfileData({...profileData, certifications: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="e.g. BCCI Level 1" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">About</label><textarea value={profileData.about} onChange={e => setProfileData({...profileData, about: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-3" placeholder="Tell students about yourself..." /></div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">Save Profile</button>
          </form>
        </div>)}

      {showEditModal && editingClassData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto py-10">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Class</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleUpdateClass} className="space-y-6">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Class Title *</label><input type="text" required value={editingClassData.title} onChange={e => setEditingClassData({...editingClassData, title: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><textarea required value={editingClassData.description} onChange={e => setEditingClassData({...editingClassData, description: e.target.value})} rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={editingClassData.category} onChange={e => setEditingClassData({...editingClassData, category: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3"><option value="sports">Sports</option><option value="dance">Dance</option><option value="music">Music</option><option value="academics">Academics</option><option value="fitness">Fitness</option><option value="coding">Coding</option><option value="arts">Arts</option><option value="languages">Languages</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₹/month) *</label><input type="number" required min={0} value={editingClassData.price} onChange={e => setEditingClassData({...editingClassData, price: Number(e.target.value)})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label><input type="text" value={editingClassData.schedule || ''} onChange={e => setEditingClassData({...editingClassData, schedule: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="text" value={editingClassData.time || ''} onChange={e => setEditingClassData({...editingClassData, time: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label><input type="text" value={editingClassData.ageGroup || ''} onChange={e => setEditingClassData({...editingClassData, ageGroup: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label><select value={editingClassData.skillLevel || 'All Levels'} onChange={e => setEditingClassData({...editingClassData, skillLevel: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select></div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Students Capacity</label><input type="number" min={1} max={1000} value={editingClassData.maxStudents || 50} onChange={e => setEditingClassData({...editingClassData, maxStudents: Number(e.target.value)})} className="w-full border border-gray-300 rounded-xl px-4 py-3" /></div>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={editingClassData.trialAvailable || false} onChange={e => setEditingClassData({...editingClassData, trialAvailable: e.target.checked})} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                  <span className="text-sm font-bold text-indigo-900">Offer Trial Classes</span>
                </label>
                {editingClassData.trialAvailable && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-indigo-900 mb-1">Trial Price (₹)</label><input type="number" min={0} value={editingClassData.trialPrice || 0} onChange={e => setEditingClassData({...editingClassData, trialPrice: Number(e.target.value)})} className="w-full border border-indigo-200 rounded-xl px-4 py-3" /></div>
                    <div><label className="block text-sm font-medium text-indigo-900 mb-1">Trial Slots (comma separated)</label><input type="text" value={editingClassData.trialSlots || ''} onChange={e => setEditingClassData({...editingClassData, trialSlots: e.target.value})} className="w-full border border-indigo-200 rounded-xl px-4 py-3" /></div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Class Photos</label>
                <input type="file" multiple accept="image/*" onChange={e => {
                  if (e.target.files) setEditClassPhotos(Array.from(e.target.files));
                }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                <p className="text-xs text-gray-400 mt-1">Leave empty to keep existing photos.</p>
              </div>

              <button type="submit" disabled={savingClass} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">{savingClass ? 'Saving Changes...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
