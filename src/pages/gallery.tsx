import { useEffect, useState } from "react";
import Image from "next/image";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
}

export default function Gallery() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Grab token from URL (?token=xxxx)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setError("Missing token.");
      setLoading(false);
      return;
    }

    fetch(`/api/list-files?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setFiles(data as DriveFile[]);
        }
      })
      .catch(() => setError("Failed to load files"))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadSelected = async () => {
    const selectedFiles = files.filter((f) => selected[f.id]);
    if (selectedFiles.length === 0) {
      alert("No files selected");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    const response = await fetch("/api/download-zip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        fileIds: selectedFiles.map((f) => f.id),
      }),
    });

    if (!response.ok) {
      alert("Failed to download ZIP");
      return;
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "photos.zip";
    link.click();
  };

  const allSelected = files.length > 0 && Object.values(selected).every(Boolean);

  const toggleSelectAll = () => {
    const newSelected: Record<string, boolean> = {};
    if (!allSelected) {
      files.forEach((f) => (newSelected[f.id] = true));
    }
    setSelected(newSelected);
  };

  if (loading)
    return <p className="p-6 text-gray-500">Loading photos...</p>;
  if (error)
    return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📸 Your Gallery</h1>

      {files.length === 0 ? (
        <p className="text-gray-600">No files found.</p>
      ) : (
        <>
          <div className="flex items-center mb-4 gap-4">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 rounded hover:bg-gray-300 transition border-gray-300 border"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>

            <button
              onClick={handleDownloadSelected}
              disabled={Object.values(selected).every((v) => !v)}
              className={`px-4 py-2 rounded shadow text-white transition ${
                Object.values(selected).every((v) => !v)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Download Selected ({Object.values(selected).filter(Boolean).length})
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="relative rounded-lg border overflow-hidden shadow hover:shadow-lg transition"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={!!selected[file.id]}
                  onChange={() => toggleSelect(file.id)}
                  className="absolute top-2 left-2 w-5 h-5 z-10"
                />

                {/* Image */}
                {file.mimeType.startsWith("image/") ? (
                  <div className="relative w-full h-40">
                    <Image
                      src={`https://drive.google.com/uc?id=${file.id}`}
                      alt={file.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-t-lg"
                    />
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-gray-200">
                    <span className="text-gray-500 text-2xl">📄</span>
                  </div>
                )}

                {/* File name */}
                <div className="p-2 flex flex-col items-center text-center">
                  <p className="text-sm truncate w-full">{file.name}</p>
                  {file.webContentLink && (
                    <a
                      href={file.webContentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-sm mt-1 hover:underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
