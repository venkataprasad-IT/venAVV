import { Scissors, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000;

const RemoveObject = () => {
  const [input, setInput] = useState('');
  const [object, setObject] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate inputs
      if (!input) {
        toast.error('Please select an image file');
        setLoading(false);
        return;
      }

      if (!object.trim()) {
        toast.error('Please enter an object name to remove');
        setLoading(false);
        return;
      }

      if (object.split(' ').length > 1) {
        toast.error('Please enter only a single object name');
        setLoading(false);
        return;
      }

      // Validate file type
      if (!input.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', input);
      formData.append('object', object.trim());

      const token = await getToken();

      const fullUrl = `${API_BASE_URL}/api/ai/remove-image-object`;
      console.log('Making request to:', fullUrl);
      console.log('FormData contents:', { image: input.name, object: object.trim() });

      const { data } = await axios.post(fullUrl, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // Increase timeout for image processing
      });

      console.log('Response received:', data);

      if (data.success) {
        setContent(data.content || data.data);
        toast.success('Object removed successfully!');
      } else {
        toast.error(data.message || 'Failed to remove object');
      }
    } catch (error) {
      console.error('Remove object error:', error);
      let errorMessage = 'Failed to remove object from image';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 404) {
          errorMessage = `Server endpoint not found. Tried: ${API_BASE_URL}/api/ai/remove-image-object`;
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Bad request. Check the image and object name.';
        } else if (error.response.status === 413) {
          errorMessage = 'Image file is too large. Please use a smaller image.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage = `Network error. Ensure server is running at ${API_BASE_URL}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. The image processing is taking too long.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Left column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">Object Removal</h1>
        </div>

        <p className="mt-6 text-sm font-medium">Upload Image</p>

        <input
          onChange={(e) => setInput(e.target.files[0])}
          type="file"
          accept="image/*"
          className="text-gray-600 w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          required
        />

        <p className="mt-6 text-sm font-medium">Describe object name to remove</p>

        <textarea
          onChange={(e) => setObject(e.target.value)}
          value={object}
          rows={4}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="e.g., watch or spoon (only single object name)"
          required
        />

        <button
          disabled={loading}
          type="submit"
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB] text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Scissors className="w-5" />
          )}
          Remove Object
        </button>
      </form>

      {/* Right column */}
      <div>
        <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-[#4A7AFF]" />
            <h1 className="text-xl font-semibold">Processed Image</h1>
          </div>
          {!content ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <Scissors className="w-9 h-9" />
                <p>Upload an image and describe the object to remove</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
              <img src={content} alt="Processed" className="w-full h-auto rounded-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveObject;
