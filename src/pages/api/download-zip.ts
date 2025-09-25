import { google } from "googleapis";
import type { NextApiRequest, NextApiResponse } from "next";
import archiver from "archiver";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, fileIds }: { token?: string; fileIds?: string[] } = req.body;

  if (!token || !fileIds || fileIds.length === 0) {
    return res.status(400).json({ error: "Missing token or file IDs" });
  }

  try {
    const folderMap: Record<string, string> = {
      abc123: process.env.GOOGLE_DRIVE_FOLDER_ID!,
      // add more token → folder mappings here if needed
    };

    const folderId = folderMap[token];
    if (!folderId) return res.status(403).json({ error: "Invalid token" });

    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    // Set headers for zip download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="photos.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (const id of fileIds) {
      // Get file metadata
      const meta = await drive.files.get({ fileId: id, fields: "name" });
      const fileName = meta.data.name || "file";

      // Get file content
      const fileStream = await drive.files.get(
        { fileId: id, alt: "media" },
        { responseType: "stream" }
      );

      archive.append(fileStream.data, { name: fileName });
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ZIP" });
  }
}
