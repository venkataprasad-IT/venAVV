 import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Heart, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

const Community = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCreations = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/user/get-published-creations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setCreations(data.creations);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const imageLikeToggle = async (id) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        '/api/user/toggle-like-creation',
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        fetchCreations();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const downloadImage = async (url, name = 'image.jpg') => {
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Image download started');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreations();
    }
  }, [user]);

  return (
    <div className="flex-1 h-full flex flex-col gap-4 p-6">
      <h1 className="text-xl font-bold text-gray-700">Creations</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-full h-60 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="bg-white h-full w-full rounded-xl overflow-y-scroll p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {creations.map((creation) => (
            <div key={creation.id} className="relative group">
              <img
                src={creation.content}
                alt={creation.prompt}
                className="w-full h-60 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-3 flex flex-col justify-end">
                <p className="text-white text-sm mb-2">{creation.prompt}</p>
                <div className="flex justify-between items-center text-white">
                  <p>{creation.likes.length} likes</p>
                  <Heart
                    onClick={() => imageLikeToggle(creation.id)}
                    className={`w-5 h-5 cursor-pointer transition-transform ${
                      creation.likes.includes(user?.id)
                        ? 'fill-red-500 text-red-600'
                        : 'text-white'
                    }`}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(creation.content, `${creation.prompt || 'image'}.jpg`);
                    }}
                    className="flex items-center gap-1 text-xs bg-white/90 text-black px-2 py-1 rounded hover:bg-white"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
