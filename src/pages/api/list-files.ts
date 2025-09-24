import { google } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";

// Simple mapping: token → Google Drive folder ID
const folderMap: Record<string, string> = {
  abc123: process.env.GOOGLE_DRIVE_FOLDER_ID!, // token "abc123" maps to your test folder
  client1: "1a2b3c4d5e6f7g8h", // another token example
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token } = req.query as { token?: string };

    if (!token || !folderMap[token]) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const folderId = folderMap[token];

    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, webContentLink)",
    });

    res.status(200).json(response.data.files);
  } catch (error) {
    console.error("Google Drive API error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
}
