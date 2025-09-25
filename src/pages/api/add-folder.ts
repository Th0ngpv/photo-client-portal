import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

interface FolderEntry {
  token: string;
  name: string;
  folderId: string;
  private: boolean;
}

const folderMapPath = path.join(process.cwd(), "folderMap.json");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const newEntry: FolderEntry = req.body;

  try {
    const raw = fs.readFileSync(folderMapPath, "utf-8");
    const folderMap = JSON.parse(raw);

    // Add new entry
    folderMap[newEntry.token] = newEntry.folderId;

    fs.writeFileSync(folderMapPath, JSON.stringify(folderMap, null, 2));

    res.status(200).json({ success: true, token: newEntry.token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update folder map" });
  }
}
