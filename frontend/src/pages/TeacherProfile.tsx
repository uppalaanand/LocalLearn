import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Award, CheckCircle, ChevronLeft, MessageSquare, Heart, Loader2 } from 'lucide-react';
import { teacherService } from '../services/dataServices';
import { useFavorites } from '../hooks/useFavorites';

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [teacher, setTeacher] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await teacherService.getTeacherById(id!);
        setTeacher(res.data);
        setTeacherClasses(res.data.classes || []);
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

  if (!teacher) {
    return <div className="text-center py-20 text-gray-500">Teacher not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
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
            <button 
              onClick={() => navigate(`/messages?userId=${teacher.id}&name=${encodeURIComponent(teacher.name)}`)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <MessageSquare className="h-5 w-5" /> Message
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-bold text-gray-900">{teacher.rating}</span>
              <span>({teacher.reviewsCount} reviews)</span>
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
                      <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400 fill-current" /> {cls.rating}</span>
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
