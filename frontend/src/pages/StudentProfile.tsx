import { notify } from '../components/Feedback';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/dataServices';
import { User as UserIcon, Mail, Phone, MapPin, Edit2, LayoutDashboard, CheckCircle, X, Save, Loader2, Calendar } from 'lucide-react';

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  console.log(user);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location?.address || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const response = await authService.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: { address: formData.location },
      });
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsEditing(false);
      setLoading(false);
      notify('Profile saved successfully');
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="relative shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-lg">
              <UserIcon className="h-12 w-12 text-indigo-400" />
            </div>
          )}
          {user.isVerified && (
            <div className="absolute bottom-1 right-1 bg-green-500 p-1.5 rounded-full border-2 border-white" title="Verified Account">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1 uppercase tracking-wide">
                {user.role}
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Mail className="h-5 w-5 text-gray-400" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Phone className="h-5 w-5 text-gray-400" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phone</p>
                  <p className="font-medium text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><MapPin className="h-5 w-5 text-gray-400" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Location</p>
                  <p className="font-medium text-gray-900">{user.location?.address || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="p-2 bg-gray-50 rounded-lg"><Calendar className="h-5 w-5 text-gray-400" /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Joined</p>
                  <p className="font-medium text-gray-900">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-4 border-t border-gray-100 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Address</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. Hyderabad, TS"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
