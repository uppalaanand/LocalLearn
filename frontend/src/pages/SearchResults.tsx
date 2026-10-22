import { ratingLabel } from '../utils/format';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Filter, SlidersHorizontal, Heart, Loader2 } from 'lucide-react';
import { classService, categoryService } from '../services/dataServices';
import { useFavorites } from '../hooks/useFavorites';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const categoryFilter = queryParams.get('category');

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [distanceFilter, setDistanceFilter] = useState<number>(10);
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  // Fetch categories
  useEffect(() => {
    categoryService.getCategories().then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  // Fetch classes with filters
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (initialQuery) params.q = initialQuery;
        if (categoryFilter) params.category = categoryFilter;
        if (priceRange < 10000) params.maxPrice = String(priceRange);
        if (minRating > 0) params.minRating = String(minRating);
        if (sortBy !== 'relevance') params.sortBy = sortBy;

        const res = await classService.getClasses(params);
        let filtered = res.data?.classes || [];

        // Client-side distance filter (since distance is stored as string)
        filtered = filtered.filter((c: any) => {
          const dist = parseFloat(c.distance);
          return !isNaN(dist) && dist <= distanceFilter;
        });

        setResults(filtered);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [initialQuery, categoryFilter, distanceFilter, priceRange, minRating, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}${categoryFilter ? `&category=${categoryFilter}` : ''}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Filters Sidebar */}
      <aside className="w-full md:w-64 shrink-0 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filters
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
              <select 
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={2}>Within 2 km</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="category-all"
                    name="category"
                    type="radio"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    checked={!categoryFilter}
                    onChange={() => navigate(`/search${initialQuery ? `?q=${initialQuery}` : ''}`)}
                  />
                  <label htmlFor="category-all" className="ml-3 text-sm text-gray-600">
                    All Categories
                  </label>
                </div>
                {categories.map((c: any) => (
                  <div key={c.id} className="flex items-center">
                    <input
                      id={`category-${c.id}`}
                      name="category"
                      type="radio"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      checked={categoryFilter === c.id}
                      onChange={() => navigate(`/search?category=${c.id}${initialQuery ? `&q=${initialQuery}` : ''}`)}
                    />
                    <label htmlFor={`category-${c.id}`} className="ml-3 text-sm text-gray-600">
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price: ₹{priceRange}</label>
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>₹0</span>
                <span>₹10,000+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select 
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value={0}>Any Rating</option>
                <option value={3}>3.0 & above</option>
                <option value={4}>4.0 & above</option>
                <option value={4.5}>4.5 & above</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="flex-1">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {loading ? 'Searching...' : `${results.length} results`} {initialQuery ? `for "${initialQuery}"` : ''}
          </h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="relevance">Relevance</option>
              <option value="distance">Distance: Nearest first</option>
              <option value="rating">Rating: High to Low</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-8 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search for classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((cls: any) => {
              const isFav = isFavorite(cls._id || cls.id);
              return (
                <div
                  key={cls._id || cls.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col sm:flex-row relative"
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
                  <div className="relative w-full sm:w-64 h-48 sm:h-auto shrink-0">
                    <img src={cls.photos?.[0]} alt={cls.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      {ratingLabel(cls.rating)}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{cls.title}</h3>
                        <p className="text-sm text-indigo-600 font-medium">{cls.academyName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-gray-900">₹{cls.price}</span>
                        <span className="text-sm text-gray-500 block">/{cls.priceUnit}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {cls.distance}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Age:</span> {cls.ageGroup}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Schedule:</span> {cls.schedule}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-700">Level:</span> {cls.skillLevel}
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={cls.teacherPhoto} alt={cls.teacherName} className="h-8 w-8 rounded-full object-cover" />
                        <span className="text-sm font-medium text-gray-900">{cls.teacherName}</span>
                      </div>
                      {cls.trialAvailable && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Trial Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {results.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
