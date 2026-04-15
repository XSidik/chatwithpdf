"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import FileService from "../../services/FileService";
import { useRouter } from "next/navigation";

const fileService = new FileService();

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fileService.getFileHistory(page, pageSize);
      if (res.success) {
        setFiles(res.data);
        setTotalCount(res.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // if (file.size > 10 * 1024 * 1024) {
    //   showNotification("File is too large (max 10MB)", "error");
    //   return;
    // }

    const chunkSize = 1 * 1024 * 1024; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileId = `${file.name}-${Date.now()}`;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("fileId", fileId);
      formData.append("chunkIndex", chunkIndex);
      formData.append("totalChunks", totalChunks);
      formData.append("fileName", file.name);

      try {
        const response = await fileService.uploadFile(formData);
        if (response.success) {
          if (chunkIndex === totalChunks - 1) {
            showNotification("File uploaded successfully!");
            setPage(1);
            fetchHistory();
          }
        }
      } catch (error) {
        console.error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}:`, error);
        showNotification(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`, "error");
        return;
      }
    }

    // setUploading(true);
    // try {
    //   const res = await fileService.uploadFile(file);
    //   if (res.success) {
    //     showNotification("File uploaded successfully!");
    //     setPage(1);
    //     fetchHistory();
    //   } else {
    //     showNotification(res.message || "Upload failed", "error");
    //   }
    // } catch (error) {
    //   console.error("Upload failed:", error);
    //   showNotification(error?.response?.data?.message || "Server error during upload", "error");
    // } finally {
    //   setUploading(false);
    //   e.target.value = ""; // Reset input
    // }
  };

  if (status === "loading" || (loading && files.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 transition-colors duration-300">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300 ${
          notification.type === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
            : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50'
        }`}>
          {notification.type === 'error' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Document History</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage and chat with your uploaded PDF files</p>
          </div>

          <label className="relative group cursor-pointer inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all duration-200 shadow-xl shadow-blue-500/20 active:scale-95 overflow-hidden">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            <span>{uploading ? "Uploading..." : "Upload New PDF"}</span>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </header>

        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
          {files.length === 0 && !loading ? (
            <div className="py-20 flex flex-col items-center text-center px-6">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">No documents yet</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm">Upload your first PDF to start chatting and extracting insights instantly.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">File Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Size</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Uploaded</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {files.map((file) => (
                    <tr key={file.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{file.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-zinc-500 dark:text-zinc-400 text-sm">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-5 text-zinc-500 dark:text-zinc-400 text-sm">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => router.push(`/chat/${file.id}`)}
                          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        >
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalCount > pageSize && (
            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} files
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page * pageSize >= totalCount}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}