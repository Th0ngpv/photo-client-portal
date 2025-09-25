import { useState } from "react";

interface FolderEntry {
  token: string;
  name: string;
  folderId: string;
  private: boolean;
}

export default function Admin() {
  const [driveLink, setDriveLink] = useState("");
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [message, setMessage] = useState("");

  const extractFolderId = (url: string) => {
    // Example: https://drive.google.com/drive/folders/<folderId>
    const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const generateToken = (length = 8) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const handleSubmit = async () => {
    const folderId = extractFolderId(driveLink);
    if (!folderId) {
      setMessage("Invalid Google Drive folder link.");
      return;
    }
    if (!name) {
      setMessage("Please provide a name.");
      return;
    }

    const token = isPrivate ? generateToken() : "public-" + Date.now();

    const newEntry: FolderEntry = {
      token,
      name,
      folderId,
      private: isPrivate,
    };

    try {
      const res = await fetch("/api/add-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      if (res.ok) {
        setMessage(`Folder added! Link: /gallery?token=${token}`);
        setDriveLink("");
        setName("");
        setIsPrivate(true);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setMessage("Failed to add folder.");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Gallery Folder</h1>

      <label className="block mb-2">
        Drive Folder Link:
        <input
          type="text"
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <label className="block mb-2">
        Gallery Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2 mt-1"
        />
      </label>

      <label className="block mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={() => setIsPrivate(!isPrivate)}
        />
        Private (only service account)
      </label>

      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Add Folder
      </button>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}
