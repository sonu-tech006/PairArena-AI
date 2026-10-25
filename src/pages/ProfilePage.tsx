import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  User as UserIcon,
  Mail,
  Shield,
  Code,
  Target,
  Sparkles,
  Check,
  Save,
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Download,
  Database,
  HardDrive
} from 'lucide-react';

interface StoredFile {
  id: string;
  filename: string;
  sizeBytes: number;
  uploadDate: string;
  downloadUrl: string;
  metadata?: {
    fileCategory: string;
    mimeType: string;
    isPublic: boolean;
  };
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Senior Software Engineer');
  const [skillLevel, setSkillLevel] = useState(user?.skillLevel || 'intermediate');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'python');
  const [goalsInput, setGoalsInput] = useState(user?.learningGoals?.join(', ') || 'DSA Mastery, System Design');
  const [saved, setSaved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // GridFS File State
  const [userFiles, setUserFiles] = useState<StoredFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const loadUserFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await apiRequest<{ files: StoredFile[] }>('/storage/my-files');
      setUserFiles(res.files || []);
    } catch (err) {
      console.warn('Failed to load user GridFS files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    loadUserFiles();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileCategory', 'avatar');
    formData.append('isPublic', 'true');

    try {
      const res = await apiRequest<{ file: StoredFile; message: string }>('/storage/upload', {
        method: 'POST',
        body: formData,
      });

      await updateProfile({
        avatarUrl: res.file.downloadUrl,
      });

      setUploadMessage('Avatar successfully uploaded to MongoDB GridFS!');
      loadUserFiles();
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileCategory', 'document');
    formData.append('isPublic', 'false');

    try {
      await apiRequest<{ file: StoredFile; message: string }>('/storage/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadMessage(`Uploaded "${file.name}" to MongoDB GridFS bucket "uploads"`);
      loadUserFiles();
      setTimeout(() => setUploadMessage(null), 4000);
    } catch (err: any) {
      setUploadMessage(`Upload error: ${err.message}`);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file from MongoDB GridFS?')) return;
    try {
      await apiRequest(`/storage/file/${fileId}`, {
        method: 'DELETE',
      });
      setUserFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const goals = goalsInput.split(',').map((g) => g.trim()).filter(Boolean);
      await updateProfile({
        name,
        bio,
        targetRole,
        skillLevel: skillLevel as any,
        preferredLanguage,
        learningGoals: goals,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Profile update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Profile & Storage Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize your interview goals, preferred coding languages, and manage documents stored in MongoDB GridFS.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        
        {/* User Badge Header with Avatar GridFS Uploader */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="text-cyan-400 font-mono">{user?.email}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{uploadingFile ? 'Uploading...' : 'Change Avatar (GridFS)'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleAvatarUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadMessage && (
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Engineering Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend / Distributed Systems Engineer"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Current Skill Level</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="beginner">Beginner (Building Foundations)</option>
                <option value="intermediate">Intermediate (Mid-Level SDE Prep)</option>
                <option value="advanced">Advanced (Staff / Principal Interview Prep)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Default Interview Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java (OpenJDK)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Bio & Experience Summary</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell interviewers about your technical background and specializations..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Learning Goals (comma separated)</label>
            <input
              type="text"
              value={goalsInput}
              onChange={(e) => setGoalsInput(e.target.value)}
              placeholder="e.g. Dynamic Programming, Distributed Rate Limiter, Production RAG"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">
              Profile changes sync across live interview rooms immediately.
            </span>

            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Preferences Saved' : 'Save Changes'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* MongoDB GridFS Cloud Storage Manager */}
      <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-xs uppercase font-semibold font-mono tracking-wider">Storage Provider: MongoDB GridFS</span>
            </div>
            <h3 className="text-xl font-bold text-white">My Cloud Documents & Uploads</h3>
            <p className="text-xs text-slate-400 mt-1">
              Binary streaming storage bucket (<code className="text-emerald-400 font-mono">uploads</code>) with authenticated owner access.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shrink-0">
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="hidden"
            />
          </label>
        </div>

        {filesLoading ? (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            Loading GridFS stored files...
          </div>
        ) : userFiles.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="text-sm font-medium text-slate-400">No files stored yet</p>
            <p className="text-xs text-slate-500">Upload resumes, PDFs, or session recordings up to 10MB.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {userFiles.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium truncate">{f.filename}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{(f.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(f.uploadDate).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{f.metadata?.fileCategory || 'document'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={f.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Download stream"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteFile(f.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete from GridFS"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
