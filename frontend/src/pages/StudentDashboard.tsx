import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Star, Bell, TrendingUp, Clock, ChevronRight, Heart, Search, Award, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';
import { studentService, classService } from '../services/dataServices';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../hooks/useFavorites';

type DashTab = 'overview' | 'schedule' | 'performance' | 'discover' | 'favorites';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [discoverClasses, setDiscoverClasses] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, discoverRes] = await Promise.all([
          studentService.getDashboard(),
          classService.getFeaturedClasses(),
        ]);
        setDashboardData(dashRes.data);
        setDiscoverClasses(discoverRes.data || []);
      } catch (error) { console.error('Error:', error); }
      finally { setLoading(false); }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  const joinedClasses = dashboardData?.joinedClasses || [];
  const combinedSchedule = dashboardData?.combinedSchedule || [];
  const notifications = dashboardData?.notifications || [];
  const tabs: { id: DashTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'favorites', label: 'Saved', icon: Heart },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your classes.</p>
        </div>
        <button onClick={() => navigate('/search')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Search className="h-4 w-4" /> Find New Classes
        </button>
      </div>

      <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-8">
        {tabs.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />{tab.label}
          </button>); })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {notifications.filter((n: any) => !n.read).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-indigo-600" /> Notifications</h2>
              <div className="space-y-3">
                {notifications.filter((n: any) => !n.read).slice(0, 3).map((n: any) => (
                  <div key={n.id} className="flex items-start gap-4 p-4 rounded-xl border bg-indigo-50/50 border-indigo-100">
                    <div className="mt-1 p-2 rounded-full bg-blue-100 text-blue-600"><Bell className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-gray-900">{n.title}</p><p className="text-sm text-gray-500 truncate">{n.message}</p></div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
                  </div>))}
              </div>
            </div>)}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Classes ({joinedClasses.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {joinedClasses.map((cls: any) => (
                <div key={cls.classId} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/class-management/${cls.classId}`)}>
                  <div className="flex justify-between items-start mb-4">
                    <div><h3 className="text-lg font-bold text-gray-900">{cls.title}</h3><p className="text-sm text-gray-500">{cls.teacherName}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cls.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{cls.paymentStatus}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Attendance</p><p className="text-lg font-bold text-gray-900">{cls.attendance}</p></div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Grade</p><p className="text-lg font-bold text-gray-900">{cls.grade}</p></div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500 mb-1">Progress</p><p className="text-lg font-bold text-gray-900">{cls.progress}%</p></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500"><Clock className="h-4 w-4" /> Next: {cls.nextSession}</div>
                    <span className="text-indigo-600 font-medium flex items-center gap-1">Manage <ChevronRight className="h-4 w-4" /></span>
                  </div>
                </div>))}
              {joinedClasses.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No classes yet</h3>
                  <button onClick={() => navigate('/search')} className="mt-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">Find Classes</button>
                </div>)}
            </div>
          </div>
        </div>)}

      {activeTab === 'schedule' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Combined Schedule</h2>
          <div className="space-y-4">
            {combinedSchedule.map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
                <div className="flex flex-col items-center justify-center h-14 w-14 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                  <span className="text-xs font-bold uppercase">{s.day?.substring(0, 3)}</span>
                  <span className="text-lg font-extrabold leading-none">{s.date?.split(' ')?.[1]?.replace(',', '') || ''}</span>
                </div>
                <div className="flex-1"><h4 className="font-bold text-gray-900">{s.title}</h4><p className="text-sm text-gray-500">{s.topic} • {s.time}</p></div>
              </div>))}
            {combinedSchedule.length === 0 && <p className="text-gray-500 text-center py-8">No upcoming sessions.</p>}
          </div>
        </div>)}

      {activeTab === 'performance' && (
        <div className="space-y-8">
          {joinedClasses.map((cls: any) => (
            <div key={cls.classId} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{cls.title}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-indigo-50 rounded-xl text-center"><BarChart3 className="h-6 w-6 text-indigo-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900">{cls.attendance}</p><p className="text-xs text-gray-500">Attendance</p></div>
                <div className="p-4 bg-green-50 rounded-xl text-center"><Award className="h-6 w-6 text-green-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900">{cls.grade}</p><p className="text-xs text-gray-500">Grade</p></div>
                <div className="p-4 bg-yellow-50 rounded-xl text-center"><TrendingUp className="h-6 w-6 text-yellow-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900">{cls.progress}%</p><p className="text-xs text-gray-500">Progress</p></div>
                <div className="p-4 bg-blue-50 rounded-xl text-center"><CheckCircle2 className="h-6 w-6 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold text-gray-900">{cls.paymentStatus}</p><p className="text-xs text-gray-500">Payment</p></div>
              </div>
              {cls.assignments?.length > 0 && (<div><h3 className="text-lg font-bold text-gray-900 mb-4">Recent Assignments</h3><div className="space-y-3">
                {cls.assignments.map((a: any) => (<div key={a.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100"><div><p className="font-medium text-gray-900">{a.title}</p><p className="text-sm text-gray-500">{a.date}</p></div><span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">{a.grade}</span></div>))}
              </div></div>)}
            </div>))}
        </div>)}

      {activeTab === 'discover' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Classes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {discoverClasses.map((cls: any) => (
              <div key={cls._id || cls.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/class/${cls._id || cls.id}`)}>
                <div className="relative h-40"><img src={cls.photos?.[0]} alt={cls.title} className="w-full h-full object-cover" /><div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><Star className="h-3 w-3 text-yellow-400 fill-current" />{cls.rating}</div></div>
                <div className="p-4"><h3 className="font-bold text-gray-900 mb-1">{cls.title}</h3><p className="text-sm text-gray-500 mb-3 line-clamp-2">{cls.description}</p><div className="flex justify-between items-center"><span className="font-bold text-gray-900">₹{cls.price}<span className="text-xs text-gray-500 font-normal">/{cls.priceUnit}</span></span><span className="text-xs text-indigo-600 font-medium">View →</span></div></div>
              </div>))}
          </div>
        </div>)}

      {activeTab === 'favorites' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Saved Classes ({favorites.length})</h2>
          {favorites.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200"><Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No saved classes</h3><p className="text-gray-500 mt-1">Heart a class to save it here!</p></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {discoverClasses.filter((c: any) => isFavorite(c._id || c.id)).map((cls: any) => (
                <div key={cls._id || cls.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg cursor-pointer relative" onClick={() => navigate(`/class/${cls._id || cls.id}`)}>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite(cls._id || cls.id); }} className="absolute top-3 left-3 z-10 p-2 bg-white/80 rounded-full"><Heart className="h-5 w-5 fill-red-500 text-red-500" /></button>
                  <div className="h-40"><img src={cls.photos?.[0]} alt={cls.title} className="w-full h-full object-cover" /></div>
                  <div className="p-4"><h3 className="font-bold text-gray-900">{cls.title}</h3><p className="font-bold text-gray-900 mt-2">₹{cls.price}</p></div>
                </div>))}
            </div>)}
        </div>)}
    </div>
  );
}
