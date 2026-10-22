import { countLabel, ratingLabel } from '../utils/format';
import { notify } from '../components/Feedback';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, CheckCircle, ChevronLeft, MessageSquare, Heart, Loader2, Edit2, Save, X } from 'lucide-react';
import { teacherService, authService } from '../services/dataServices';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../context/AuthContext';

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, setUser } = useAuth();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});
  
  const isOwner = user?._id === id;

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await teacherService.getTeacherById(id!);
        setTeacher(res.data);
        console.log(res.data);
        setTeacherClasses(res.data.classes || []);
        
        setFormData({
          name: res.data.name || '',
          experience: res.data.experience || '',
          about: res.data.about || '',
          locationAddress: res.data.location || '',
          skills: res.data.skills?.join(', ') || '',
          certifications: res.data.certifications?.join(', ') || '',
        });
      } catch (error) {
        console.error('Error fetching teacher:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTeacher();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setUpdateLoading(true);
      await teacherService.updateProfile({
        name: formData.name,
        experience: formData.experience,
        about: formData.about,
        location: formData.locationAddress,
        skills: formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
        certifications: formData.certifications.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      const updated = await teacherService.getTeacherById(id!);
      setTeacher(updated.data);
      setTeacherClasses(updated.data.classes || []);
      const me = await authService.getMe();
      setUser(me.data.user);
      localStorage.setItem('user', JSON.stringify(me.data.user));
      setIsEditing(false);
      setUpdateLoading(false);
      notify('Profile saved successfully');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.message || 'Failed to update profile');
      setUpdateLoading(false);
    }
  };

  if (!teacher) {
    return <div className="text-center py-20 text-gray-500">Teacher not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <p className="text-sm text-gray-500 mb-3">{teacher?.createdAt ? `Joined ${new Date(teacher.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'Join date unavailable'}</p>
      {isOwner && <button className="text-sm underline mb-4" onClick={async () => { try { await teacherService.updateProfile({ featured: false }); notify('Your profile is no longer featured'); } catch (err: any) { notify(err.message); } }}>Remove my profile from featured teachers</button>}
      <button onClick={() => navigate("/dashboard")} className="text-indigo-600 mr-6">Dashboard</button>
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8"
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12 flex flex-col md:flex-row gap-8 items-start">
        <div className="relative shrink-0">
          <img src={teacher.photo} alt={teacher.name} className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-lg" />
          <div className="absolute bottom-2 right-2 bg-green-500 p-1.5 rounded-full border-2 border-white" title="Verified">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{teacher.name}</h1>
              <p className="text-lg text-indigo-600 font-medium">{teacher.skills?.[0]}</p>
            </div>
            
            {isOwner ? (
              !isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
                >
                  <Edit2 className="h-5 w-5" /> Edit Profile
                </button>
              )
            ) : (
              <button 
                onClick={() => navigate(`/messages?userId=${teacher.id}&name=${encodeURIComponent(teacher.name)}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <MessageSquare className="h-5 w-5" /> Message
              </button>
            )}
          </div>

          {!isEditing ? (
            <>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-bold text-gray-900">{ratingLabel(teacher.rating)}</span>
                  <span>{`(${countLabel(teacher.reviewsCount, "review", "reviews")})`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  {teacher.location}
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-5 w-5 text-gray-400" />
                  {teacher.experience} Experience
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">About</h3>
                <p className="text-gray-600 leading-relaxed">{teacher.about}</p>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-gray-100">
              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" name="locationAddress" value={formData.locationAddress} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input type="text" name="experience" value={formData.experience} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 5+ Years" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                  <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (comma separated)</label>
                  <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                  <textarea name="about" value={formData.about} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={updateLoading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70">
                  {updateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Changes
                </button>
                <button type="button" onClick={() => setIsEditing(false)} disabled={updateLoading} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-8">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {teacher.skills?.map((skill: string) => (
                <span key={skill} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" /> Certifications
            </h3>
            <ul className="space-y-3">
              {teacher.certifications?.map((cert: string) => (
                <li key={cert} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Classes List */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Classes by {teacher.name?.split(' ')[0]}</h2>
          
          <div className="space-y-6">
            {teacherClasses.map((cls: any) => (
              <div 
                key={cls._id || cls.id} 
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row gap-6 relative"
                onClick={() => navigate(`/class/${cls._id || cls.id}`)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(cls._id || cls.id);
                  }}
                  className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100"
                >
                  <Heart className={`h-5 w-5 ${isFavorite(cls._id || cls.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
                <img src={cls.photos?.[0]} alt={cls.title} className="w-full sm:w-48 h-32 object-cover rounded-xl shrink-0" />
                
                <div className="flex-1 flex flex-col justify-between pr-12">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{cls.title}</h3>
                      <span className="font-bold text-gray-900">₹{cls.price}<span className="text-xs text-gray-500 font-normal">/{cls.priceUnit}</span></span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{cls.academyName}</p>
                    
                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {cls.distance}</span>
                      <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-current" /> {ratingLabel(cls.rating)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                    <span className="text-gray-500">{cls.schedule} • {cls.time}</span>
                    <span className="text-indigo-600 font-medium hover:underline">View Details</span>
                  </div>
                </div>
              </div>
            ))}

            {teacherClasses.length === 0 && (
              <p className="text-gray-500 italic">No active classes listed at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
