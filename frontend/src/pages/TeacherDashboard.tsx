import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, DollarSign, MessageSquare, Plus, ChevronRight, Settings, Loader2, BookOpen } from 'lucide-react';
import { teacherDashService, classService, teacherService } from '../services/dataServices';
import { useAuth } from '../context/AuthContext';

type TeacherTab = 'overview' | 'create' | 'profile';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TeacherTab>('overview');
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [newClass, setNewClass] = useState({ title: '', description: '', category: 'sports', price: 2000, schedule: '', time: '', ageGroup: '', skillLevel: 'All Levels', maxStudents: 50 });
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', experience: '', skills: '', certifications: '', about: '', location: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await teacherDashService.getDashboard();
        setDashData(res.data);
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
      await classService.createClass(newClass);
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
    </div>
  );
}
