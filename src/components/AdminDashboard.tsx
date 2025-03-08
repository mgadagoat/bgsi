import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Item } from '../types/database';
import { Plus, Edit, Trash2, LogOut, X, Upload, Link as LinkIcon } from 'lucide-react';

const DEFAULT_IMAGE = 'https://coffective.com/wp-content/uploads/2018/06/default-featured-image.png.jpg';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AdminDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [user, setUser] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadItems();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin');
      return;
    }
    setUser(session.user);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading items:', error);
      return;
    }

    setItems(data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFormError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFormError('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    setSelectedFile(file);
    setFormError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Error uploading image');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const validateImageUrl = (url: string): boolean => {
    return url.match(/\.(jpg|jpeg|png|webp)$/i) !== null;
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingItem) return;

    try {
      let imageUrl = editingItem.image_url;

      // Handle image upload or URL validation
      if (uploadMethod === 'file' && selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      } else if (uploadMethod === 'url') {
        if (!editingItem.image_url) {
          imageUrl = DEFAULT_IMAGE;
        } else if (!validateImageUrl(editingItem.image_url)) {
          setFormError('Invalid image URL. Must end with .jpg, .png, or .webp');
          return;
        }
      }

      const timestamp = new Date().toISOString();
      const itemData = {
        ...editingItem,
        image_url: imageUrl,
        updated_at: timestamp
      };

      let error;
      if (editingItem.id) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingItem.id);
        error = updateError;

        // Record value change in history if the value changed
        const existingItem = items.find(i => i.id === editingItem.id);
        if (existingItem && existingItem.current_value !== editingItem.current_value) {
          await supabase.from('item_history').insert({
            item_id: editingItem.id,
            value: editingItem.current_value,
            date: new Date().toISOString().split('T')[0]
          });
        }
      } else {
        // Create new item
        const { error: insertError } = await supabase
          .from('items')
          .insert({
            ...itemData,
            created_at: timestamp,
            change: '0',
            trend: 'stable'
          });
        error = insertError;
      }

      if (error) throw error;

      setEditingItem(null);
      setSelectedFile(null);
      setImagePreview('');
      loadItems();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return;
    }

    loadItems();
  };

  const resetForm = () => {
    setEditingItem(null);
    setSelectedFile(null);
    setImagePreview('');
    setUploadMethod('url');
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-custom">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-space">Admin Dashboard</h1>
            {user && (
              <p className="text-gray-400 mt-1">Welcome, {user.user_metadata.name || user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEditingItem({ 
                id: '', 
                name: '', 
                description: '',
                current_value: 0, 
                trend: 'stable', 
                change: '0', 
                image_url: '', 
                created_at: '', 
                updated_at: '', 
                additional_fields: {} 
              })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Item
            </button>
            <button
              onClick={handleSignOut}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-gray-800/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image_url || DEFAULT_IMAGE}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <p className="text-gray-400 mt-1">{item.description}</p>
                    <p className="text-primary font-medium mt-2">Current Value: {item.current_value}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="btn-secondary p-2"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingItem.id ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button 
                onClick={resetForm}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-6">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Current Value
                  </label>
                  <input
                    type="number"
                    value={editingItem.current_value}
                    onChange={(e) => setEditingItem({ ...editingItem, current_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Trend
                  </label>
                  <select
                    value={editingItem.trend}
                    onChange={(e) => setEditingItem({ ...editingItem, trend: e.target.value as Item['trend'] })}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                    required
                  >
                    <option value="rising">Rising</option>
                    <option value="falling">Falling</option>
                    <option value="stable">Stable</option>
                  </select>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('file')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                        uploadMethod === 'file'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-gray-800/30'
                      }`}
                    >
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm text-center">Upload Image</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                        uploadMethod === 'url'
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-700 bg-gray-800/30'
                      }`}
                    >
                      <LinkIcon className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm text-center">Image URL</p>
                    </button>
                  </div>

                  {uploadMethod === 'file' ? (
                    <div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="block w-full p-4 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">
                            Click to upload image (JPG, PNG, WebP, max 5MB)
                          </p>
                        </div>
                      </label>
                      {imagePreview && (
                        <div className="mt-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-lg mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={editingItem.image_url}
                        onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                        placeholder="https://example.com/image.jpg"
                      />
                      <p className="text-sm text-gray-400 mt-2">
                        Enter a direct image URL (must end with .jpg, .png, or .webp)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingItem.id ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}