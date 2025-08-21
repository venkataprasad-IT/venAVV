import { FileText, FileTextIcon, Sparkles, ArrowLeft, Download } from 'lucide-react';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Markdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

// Configure axios defaults
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Force axios to use the correct base URL
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = 30000; // 30 second timeout

// Log the actual base URL being used
console.log('🚀 Actual API Base URL:', axios.defaults.baseURL);
console.log('🚀 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

const ReviewResume = () => {
  const [input, setInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!input) {
      setError('Please select a resume file');
      toast.error('Please select a resume file');
      return;
    }
    
    setError(''); // Clear any previous errors
    setContent(''); // Clear any previous content

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('resume', input);

      const fullUrl = `${API_BASE_URL}/api/ai/resume-review`;
      console.log('🌐 Making request to:', fullUrl);
      
      const { data } = await axios.post(
        fullUrl,
        formData,
        { 
          timeout: 60000 // 60 second timeout for file upload
        }
      );

      if (data.success) {
        setContent(data.content);
        setError(''); // Clear any errors on success
        toast.success(data.message || 'Resume reviewed successfully!');
      } else {
        setError(data.message);
        toast.error(data.message);
      }
         } catch (error) {
       let errorMessage = 'An error occurred while processing your resume';
       
               if (error.response) {
          if (error.response.status === 404) {
            errorMessage = `Server not found (404). Tried to reach: ${API_BASE_URL}/api/ai/resume-review. Please check if the server is running on port 3000.`;
          } else if (error.response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.response.status === 403) {
            errorMessage = 'Premium subscription required for this feature.';
          } else {
            errorMessage = error.response.data?.message || 'Server error occurred';
          }
        } else if (error.request) {
          errorMessage = `Network error. Tried to reach: ${API_BASE_URL}/api/ai/resume-review. Please check your connection and if the server is running.`;
        }
       
       setError(errorMessage);
       toast.error(errorMessage);
     } finally {
       setLoading(false);
     }
  };

  const downloadPdf = () => {
    try {
      if (!content) return;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const maxWidth = pageWidth - margin * 2;
      const lines = doc.splitTextToSize(content, maxWidth);
      let y = margin;
      const lineHeight = 16;
      lines.forEach((line) => {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      doc.save('resume-review.pdf');
      toast.success('Downloaded PDF');
    } catch (e) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">
      {/* Previous button */}
      <div className="w-full mb-4">
        <button
          onClick={() => navigate('/ai')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
      
      {/* Left column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00DA83]" />
          <h1 className="text-xl font-semibold">📝 Resume Review</h1>
        </div>

        <p className="mt-6 text-sm font-medium">📤 Upload Resume</p>
        
        {/* Server status check */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
          <div className="flex items-center gap-2">
            <span>🌐</span>
            <span><strong>Server URL:</strong> {API_BASE_URL}</span>
          </div>
          <div className="mt-1">
            <span><strong>Target Endpoint:</strong> {API_BASE_URL}/api/ai/resume-review</span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            <span>💡 Make sure your server is running on port 3000 before testing</span>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE_URL}/api/test`);
                  const data = await response.json();
                  toast.success(`Server is reachable! ${data.message}`);
                } catch (error) {
                  toast.error(`Server not reachable: ${error.message}`);
                }
              }}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Test Server Connection
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`${API_BASE_URL}/api/health`);
                  const data = await response.json();
                  toast.success(`Server health: ${data.status}`);
                } catch (error) {
                  toast.error(`Health check failed: ${error.message}`);
                }
              }}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Health Check
            </button>
          </div>
        </div>

        <input
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              if (file.type !== 'application/pdf') {
                setError('Please select a PDF file');
                toast.error('Please select a PDF file');
                e.target.value = '';
                setInput(null);
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                toast.error('File size must be less than 5MB');
                e.target.value = '';
                setInput(null);
                return;
              }
              setInput(file);
              setError(''); // Clear any errors
              toast.success('PDF file selected successfully');
            }
          }}
          type="file"
          accept="application/pdf"
          className="text-gray-600 w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          required
        />

        <p className="text-xs text-gray-500 font-light mt-1">
          📄 Supports PDF Resume Only. Maximum file size: 5MB.
        </p>
        
                 {error && (
           <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
             <div className="flex items-start gap-2">
               <span className="text-red-500">❌</span>
               <span>{error}</span>
             </div>
           </div>
         )}

        <button
          disabled={loading}
          type="submit"
          className={`w-full flex justify-center items-center gap-2 px-4 py-2 mt-6 text-sm rounded-lg ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-[#00DA83] to-[#009bb3] cursor-pointer'
          } text-white`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <FileTextIcon className="w-5" />
              Review Resume
            </>
          )}
        </button>
      </form>

      {/* Right column */}
      <div>
        <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#00DA83]" />
            <h1 className="text-xl font-semibold">📊 Analysis Results</h1>
            {content && (
              <button
                onClick={downloadPdf}
                className="ml-auto flex items-center gap-2 text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                title="Download as PDF"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            )}
          </div>
        
        {content && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-600 text-xs">
            ✅ Resume reviewed successfully! Here's your detailed feedback:
          </div>
        )}
          {!content ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <FileText className="w-9 h-9" />
                <p>📤 Upload a resume and click "Review Resume" to get started</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#00DA83]"></div>
                <p>⏳ Processing your resume...</p>
              </div>
            </div>
          ) : (
            <div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
              <div className="prose prose-sm max-w-none">
                <Markdown 
                  components={{
                    h1: (props) => <h1 className="text-xl font-bold mb-2" {...props} />,
                    h2: (props) => <h2 className="text-lg font-semibold mb-2" {...props} />,
                    h3: (props) => <h3 className="text-base font-medium mb-1" {...props} />,
                    p: (props) => <p className="mb-2" {...props} />,
                    ul: (props) => <ul className="list-disc list-inside mb-2" {...props} />,
                    ol: (props) => <ol className="list-decimal list-inside mb-2" {...props} />,
                    li: (props) => <li className="mb-1" {...props} />,
                    strong: (props) => <strong className="font-semibold" {...props} />,
                    em: (props) => <em className="italic" {...props} />
                  }}
                >
                  {content}
                </Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewResume;
