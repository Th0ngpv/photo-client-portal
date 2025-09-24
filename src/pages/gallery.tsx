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
  const [loading, setLoading] = useState<boolean>(true);
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

  const handleDownloadSelected = () => {
    const selectedFiles = files.filter((f) => selected[f.id]);
    if (selectedFiles.length === 0) {
      alert("No files selected");
      return;
    }

    // Open each file in a new tab (Google Drive way)
    selectedFiles.forEach((file) => {
      if (file.webContentLink) {
        window.open(file.webContentLink, "_blank");
      }
    });

    // TODO: Optionally implement backend ZIP download
  };

  if (loading) return <p className="p-6 text-gray-500">Loading photos...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📸 Your Gallery</h1>

      {files.length === 0 ? (
        <p className="text-gray-600">No files found.</p>
      ) : (
        <>
          <button
            onClick={handleDownloadSelected}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
          >
            Download Selected
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border shadow hover:shadow-lg transition relative"
              >
                <input
                  type="checkbox"
                  checked={!!selected[file.id]}
                  onChange={() => toggleSelect(file.id)}
                  className="absolute top-2 left-2 w-4 h-4"
                />

                {file.mimeType.startsWith("image/") ? (
                  <Image
                    src={`https://drive.google.com/uc?id=${file.id}`}
                    alt={file.name}
                    width={400}
                    height={300}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center bg-gray-200 rounded-t-lg">
                    <span className="text-gray-500">📄</span>
                  </div>
                )}

                <div className="p-2 flex flex-col items-center">
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
