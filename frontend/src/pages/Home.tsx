import { countLabel, ratingLabel } from '../utils/format';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, ChevronRight, Heart, Loader2 } from 'lucide-react';
import { categoryService, classService, teacherService } from '../services/dataServices';
import { useFavorites } from '../hooks/useFavorites';

// Helper to map icon names to actual components
import { HelpCircle, Music, Dumbbell, Palette, BookOpen, Code, Languages, Trophy, GraduationCap, Camera } from 'lucide-react';
const Icons: Record<string, React.ElementType> = { HelpCircle, Music, Dumbbell, Palette, BookOpen, Code, Languages, Trophy, GraduationCap, Camera };

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // State for API data
  const [categories, setCategories] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, classRes, teacherRes] = await Promise.all([
          categoryService.getCategories(),
          classService.getFeaturedClasses(),
          teacherService.getTeachers(),
        ]);
        setCategories(catRes.data || []);
        setClasses((classRes.data || []).slice(0, 3));
        setTeachers((teacherRes.data || []).slice(0, 6));
      } catch (error) {
        setLoadError('Unable to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };


  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Discover the best classes <span className="text-indigo-600">near you</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          From cricket coaching to classical dance, find the perfect learning experience in your neighborhood.
        </p>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8 relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-32 py-4 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-lg shadow-sm"
            placeholder="e.g. 'Dance classes', 'Math tutor'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
          <MapPin className="h-4 w-4" />
          <span>Browse classes and refine your search</span>
          <button onClick={() => navigate("/search")} className="text-indigo-600 hover:underline ml-2">Filters</button>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Explore Categories</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category: any) => {
            const IconComponent = (Icons as any)[category.icon] || Icons.HelpCircle;
            return (
              <button
                key={category.id}
                onClick={() => navigate(`/search?category=${category.id}`)}
                className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-2xl hover:border-indigo-500 hover:shadow-md transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                  <IconComponent className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-900">{category.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Classes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Classes Near You</h2>
          <button onClick={() => navigate('/search')} className="text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls: any) => {
            const isFav = isFavorite(cls._id || cls.id);
            return (
              <div
                key={cls._id || cls.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col relative"
                onClick={() => navigate(`/class/${cls._id || cls.id}`)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(cls._id || cls.id);
                  }}
                  className="absolute top-3 left-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                >
                  <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                <div className="relative h-48">
                  <img src={cls.photos?.[0]} alt={cls.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    {ratingLabel(cls.rating)}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {cls.distance}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{cls.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cls.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={cls.teacherPhoto} alt={cls.teacherName} className="h-8 w-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-gray-700">{cls.teacherName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">₹{cls.price}</span>
                      <span className="text-xs text-gray-500">/{cls.priceUnit}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top Teachers */}
      <section className="bg-indigo-50 rounded-3xl p-8 sm:p-12 mt-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Learn from the Best</h2>
          <p className="text-gray-600 mt-2">Top-rated instructors in your area</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {teachers.map((teacher: any) => (
            <div
              key={teacher.id}
              className="bg-white rounded-2xl p-6 text-center hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/teacher/${teacher.id}`)}
            >
              <img src={teacher.photo} alt={teacher.name} className="h-24 w-24 rounded-full mx-auto object-cover border-4 border-indigo-50 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
              <p className="text-sm text-indigo-600 font-medium mb-2">{teacher.skills?.[0]}</p>
              <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-4">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-700">{ratingLabel(teacher.rating)}</span>
                <span>{`(${countLabel(teacher.reviewsCount, "review", "reviews")})`}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{teacher.about}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
