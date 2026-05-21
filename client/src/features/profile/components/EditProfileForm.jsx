import { memo, useState } from 'react';
import { X, Upload } from 'lucide-react';

const EditProfileForm = memo(({ user, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    bio: user?.bio || '',
    gender: user?.gender || '',
    birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
    primaryInterest: user?.primaryInterest === 'Movies' ? 1 : user?.primaryInterest === 'Games' ? 2 : 0,
    isHistoryPublic: user?.isHistoryPublic ?? true
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    user?.profilePicUrl ? `http://localhost:5222${user.profilePicUrl}` : null
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      bio: formData.bio,
      gender: formData.gender || null,
      birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      primaryInterest: parseInt(formData.primaryInterest),
      isHistoryPublic: formData.isHistoryPublic
    };
    onSave({ ...payload, avatarFile });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-md">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900/60 border-b border-zinc-700/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <div className="relative w-40 h-40 rounded-2xl overflow-hidden ring-2 ring-indigo-500/50 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-6xl font-bold">
                    {formData.firstName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 px-6 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl cursor-pointer hover:bg-zinc-800/50 hover:border-indigo-500/50 transition-all">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-zinc-300">Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                maxLength={50}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                maxLength={50}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
              rows={3}
              maxLength={200}
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-zinc-500 mt-1">{formData.bio.length}/200</p>
          </div>

          {/* Gender and Birth Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {/* Primary Interest */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Primary Interest</label>
            <select
              name="primaryInterest"
              value={formData.primaryInterest}
              onChange={handleInputChange}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            >
              <option value={0}>Mixed</option>
              <option value={1}>Movies</option>
              <option value={2}>Games</option>
            </select>
          </div>

          {/* History Privacy */}
          <div className="flex items-center gap-3 p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
            <input
              type="checkbox"
              id="isHistoryPublic"
              name="isHistoryPublic"
              checked={formData.isHistoryPublic}
              onChange={handleInputChange}
              className="w-4 h-4 accent-indigo-500 cursor-pointer rounded"
            />
            <label htmlFor="isHistoryPublic" className="text-sm text-zinc-300 cursor-pointer flex-1">
              Make my movie and game history public
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-xl transition-all disabled:opacity-50 text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all disabled:opacity-50 text-white font-medium"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

EditProfileForm.displayName = 'EditProfileForm';
export default EditProfileForm;
