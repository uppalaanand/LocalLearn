import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Megaphone, Calendar, MessageSquare, CheckSquare, DollarSign, Users, Plus, Send, CheckCircle2, X, Loader2 } from 'lucide-react';
import { classManagementService } from '../services/dataServices';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';

type Tab = 'announcements' | 'schedule' | 'chat' | 'attendance' | 'payments' | 'members';

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ title: '', announcements: [], schedule: [], chat: [], students: [] });
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as Tab;
    if (tabParam && ['announcements', 'schedule', 'chat', 'attendance', 'payments', 'members'].includes(tabParam)) setActiveTab(tabParam);
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await classManagementService.getClassManagement(id!);
        setData(res.data);
      } catch (error) { console.error('Error:', error); }
      finally { setLoading(false); }
    };
    if (id) fetchData();
  }, [id]);

  const handleSaveAttendance = async () => {
    const records = Object.entries(attendanceState).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) return;
    try {
      await classManagementService.markAttendance(id!, records);
      setIsMarkingAttendance(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) { console.error('Error saving attendance:', err); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      const res = await classManagementService.sendMessage(id!, chatInput);
      setData((prev: any) => ({ ...prev, chat: [...prev.chat, res.data] }));
      setChatInput('');
    } catch (err) { console.error('Error sending message:', err); }
  };

  const currentStudent = data.students?.[0];
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'chat', label: 'Group Chat', icon: MessageSquare },
    { id: 'attendance', label: role === 'teacher' ? 'Attendance' : 'My Attendance', icon: CheckSquare },
    { id: 'payments', label: role === 'teacher' ? 'Payments' : 'My Payments', icon: DollarSign },
    { id: 'members', label: role === 'teacher' ? 'Members' : 'Classmates', icon: Users },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24 h-[calc(100vh-8rem)] flex flex-col relative">
      {showSuccess && (<div className="absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4"><CheckCircle2 className="h-5 w-5" /><span className="font-medium">Attendance saved successfully!</span></div>)}

      {showAddStudent && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Add New Student</h3><button onClick={() => setShowAddStudent(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label><input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. John Doe" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="john@example.com" /></div><button onClick={() => setShowAddStudent(false)} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">Send Invite</button></div></div></div>)}

      {selectedStudent && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-4"><div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">{selectedStudent.name.charAt(0)}</div><div><h3 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h3><p className="text-sm text-gray-500">Joined Oct 2023</p></div></div><button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><div className="space-y-4">{role === 'teacher' && (<><div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Attendance Rate</h4><p className="text-2xl font-bold text-gray-900">{selectedStudent.attendance}</p></div><div className="bg-gray-50 p-4 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h4><span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block mt-1 ${selectedStudent.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedStudent.paymentStatus}</span></div></>)}<div className="flex gap-3 pt-4"><button className="flex-1 bg-indigo-50 text-indigo-600 font-medium py-2.5 rounded-xl hover:bg-indigo-100 transition-colors">Message</button>{role === 'teacher' && (<button className="flex-1 bg-white border border-gray-200 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">View Full Report</button>)}</div></div></div></div>)}

      {editingSchedule && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-900">Edit Session</h3><button onClick={() => setEditingSchedule(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Topic</label><input type="text" defaultValue={editingSchedule.topic} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="text" defaultValue={editingSchedule.date} className="w-full border border-gray-300 rounded-lg p-2.5" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Time</label><input type="text" defaultValue={editingSchedule.time} className="w-full border border-gray-300 rounded-lg p-2.5" /></div></div><button onClick={() => setEditingSchedule(null)} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors mt-2">Save Changes</button></div></div></div>)}

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
        {activeTab === 'announcements' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Recent Announcements</h2>{role === 'teacher' && (<button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> New Post</button>)}</div><div className="space-y-4">{data.announcements.map((ann: any) => (<div key={ann.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-100"><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{ann.author.charAt(0)}</div><div><h4 className="font-bold text-gray-900">{ann.author}</h4><span className="text-xs text-gray-500">{ann.date}</span></div></div></div><p className="text-gray-700 whitespace-pre-line">{ann.text}</p></div>))}</div></div>)}

        {activeTab === 'schedule' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>{role === 'teacher' && (<button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> Add Session</button>)}</div><div className="space-y-4">{data.schedule.map((session: any) => (<div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-indigo-300 transition-colors gap-4"><div className="flex items-center gap-4"><div className="flex flex-col items-center justify-center h-14 w-14 bg-indigo-50 rounded-xl text-indigo-600 shrink-0"><span className="text-xs font-bold uppercase">{session.day.substring(0, 3)}</span><span className="text-lg font-extrabold leading-none">{session.date.split(' ')[1]?.replace(',', '')}</span></div><div><h4 className="font-bold text-gray-900">{session.topic}</h4><div className="flex items-center gap-2 text-sm text-gray-500 mt-1"><Calendar className="h-4 w-4" /> {session.date} • {session.time}</div></div></div>{role === 'teacher' && (<div className="flex gap-2 w-full sm:w-auto"><button onClick={() => setEditingSchedule(session)} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Edit</button><button onClick={() => { setActiveTab('attendance'); setIsMarkingAttendance(true); }} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-xl hover:bg-indigo-100 transition-colors">Mark Attendance</button></div>)}</div>))}</div></div>)}

        {activeTab === 'chat' && (<div className="flex flex-col h-full -m-6"><div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0"><div><h2 className="font-bold text-gray-900">{data.title} Group</h2><p className="text-xs text-gray-500">{data.students.length + 1} participants</p></div>{role === 'teacher' && (<button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Mute Chat</button>)}</div><div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">{data.chat.map((msg: any) => (<div key={msg.id} className={`flex flex-col ${msg.isTeacher ? 'items-end' : 'items-start'}`}><div className="flex items-baseline gap-2 mb-1"><span className="text-xs font-medium text-gray-500">{msg.sender}</span><span className="text-[10px] text-gray-400">{msg.time}</span></div><div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${msg.isTeacher ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}><p className="text-sm">{msg.text}</p></div></div>))}</div><div className="p-4 border-t border-gray-200 bg-white shrink-0"><div className="flex items-center gap-2"><input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full px-4 py-2.5 text-sm transition-all" /><button onClick={handleSendMessage} className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shrink-0"><Send className="h-4 w-4" /></button></div></div></div>)}

        {activeTab === 'attendance' && (<div className="space-y-6">
          {role === 'student' ? (
            <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-2xl p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">My Attendance Overview</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Attendance Rate</h4><p className="text-3xl font-bold text-gray-900">{currentStudent?.attendance || '0%'}</p></div><div className="p-4 bg-gray-50 rounded-xl border border-gray-100"><h4 className="text-sm font-medium text-gray-500 mb-1">Classes Attended</h4><p className="text-3xl font-bold text-gray-900">17 <span className="text-lg text-gray-500 font-medium">/ 20</span></p></div></div></div></div>
          ) : isMarkingAttendance ? (
            <div className="animate-in fade-in"><div className="flex justify-between items-center mb-6"><div><h2 className="text-xl font-bold text-gray-900">Mark Attendance: Today</h2><p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p></div><button onClick={() => setIsMarkingAttendance(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button></div><div className="space-y-3 mb-8">{data.students.map((student: any) => (<div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl gap-4"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{student.name.charAt(0)}</div><span className="font-bold text-gray-900">{student.name}</span></div><div className="flex gap-2 w-full sm:w-auto"><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'present' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'present' ? 'bg-green-500 text-white border-green-500' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>Present</button><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'absent' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'absent' ? 'bg-red-500 text-white border-red-500' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>Absent</button><button onClick={() => setAttendanceState(prev => ({ ...prev, [student.id]: 'late' }))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${attendanceState[student.id] === 'late' ? 'bg-yellow-500 text-white border-yellow-500' : 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'}`}>Late</button></div></div>))}</div><div className="flex justify-end"><button onClick={handleSaveAttendance} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md">Save Attendance</button></div></div>
          ) : (
            <><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Overall Attendance</h2><div className="flex items-center gap-3"><button onClick={() => setIsMarkingAttendance(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"><CheckSquare className="h-4 w-4" /> Mark Today</button></div></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 rounded-tl-lg">Student Name</th><th className="px-6 py-3">Attendance %</th><th className="px-6 py-3 rounded-tr-lg text-right">Action</th></tr></thead><tbody>{data.students.map((student: any, idx: number) => (<tr key={student.id} className={`bg-white ${idx !== data.students.length - 1 ? 'border-b border-gray-100' : ''}`}><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{student.name.charAt(0)}</div>{student.name}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]"><div className={`h-2.5 rounded-full ${parseInt(student.attendance) > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: student.attendance }}></div></div><span className="font-medium text-gray-700">{student.attendance}</span></div></td><td className="px-6 py-4 text-right"><button className="font-medium text-indigo-600 hover:text-indigo-800">View Details</button></td></tr>))}</tbody></table></div></>
          )}</div>)}

        {activeTab === 'payments' && (<div className="space-y-6">
          {role === 'student' ? (
            <div className="space-y-6"><div className="bg-white border border-gray-200 rounded-2xl p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">My Fee Status</h2><div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><p className="text-sm text-gray-500 font-medium mb-1">Current Month</p><p className="text-3xl font-bold text-gray-900">₹2,500</p></div><span className={`px-4 py-1.5 rounded-full text-sm font-bold ${currentStudent?.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{currentStudent?.paymentStatus || 'Pending'}</span></div></div></div>
          ) : (
            <><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Fee Status</h2><button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors">Send Reminders</button></div><div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-6 py-3 rounded-tl-lg">Student Name</th><th className="px-6 py-3">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 rounded-tr-lg text-right">Action</th></tr></thead><tbody>{data.students.map((student: any, idx: number) => (<tr key={student.id} className={`bg-white ${idx !== data.students.length - 1 ? 'border-b border-gray-100' : ''}`}><td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td><td className="px-6 py-4 font-medium text-gray-900">₹2,500</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{student.paymentStatus}</span></td><td className="px-6 py-4 text-right">{student.paymentStatus === 'Pending' ? (<button className="font-medium text-indigo-600 hover:text-indigo-800">Remind</button>) : (<button className="font-medium text-gray-500 hover:text-gray-700">Receipt</button>)}</td></tr>))}</tbody></table></div></>
          )}</div>)}

        {activeTab === 'members' && (<div className="space-y-6"><div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-gray-900">Class Members ({data.students.length})</h2>{role === 'teacher' && (<button onClick={() => setShowAddStudent(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"><Plus className="h-4 w-4" /> Add Student</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{data.students.map((student: any) => (<div key={student.id} onClick={() => role === 'teacher' ? setSelectedStudent(student) : null} className={`flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl transition-colors ${role === 'teacher' ? 'hover:border-indigo-300 cursor-pointer' : ''}`}><div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">{student.name.charAt(0)}</div><div className="flex-1 min-w-0"><h4 className="font-bold text-gray-900 truncate">{student.name}</h4><p className="text-sm text-gray-500 truncate">Joined Oct 2023</p></div><button onClick={(e) => { e.stopPropagation(); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"><MessageSquare className="h-4 w-4" /></button></div>))}</div></div>)}
      </div>
    </div>
  );
}
