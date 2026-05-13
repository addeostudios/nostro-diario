
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // GitHub Upload API
  app.post("/api/upload-to-github", async (req, res) => {
    const { fileName, content, coupleId } = req.body;
    
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
    const GITHUB_REPO = process.env.GITHUB_REPO?.trim();

    console.log(`[GitHub Upload] Attempting upload for couple: ${coupleId}, file: ${fileName}`);

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ 
        error: "Configurazione mancante", 
        details: "Assicurati di aver impostato GITHUB_TOKEN e GITHUB_REPO nelle 'Secrets' di AI Studio." 
      });
    }

    try {
      const repoPath = GITHUB_REPO.replace('https://github.com/', '').replace(/\/$/, '');
      const path = `photos/${coupleId}/${fileName}`;
      const url = `https://api.github.com/repos/${repoPath}/contents/${path}`;
      
      const response = await axios.put(url, {
        message: `Aggiunta foto: ${fileName}`,
        content: content,
      }, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        }
      });

      // Instead of the raw URL (which fails for private repos), 
      // we return our proxy URL
      const proxyUrl = `/api/photo-proxy?path=${encodeURIComponent(path)}`;
      res.json({ url: proxyUrl });
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`[GitHub Upload] Error ${status}:`, JSON.stringify(data || error.message));
      
      let message = "Errore durante il caricamento su GitHub.";
      if (status === 404) {
        message = "Repository non trovato. Verifica che GITHUB_REPO sia 'proprietario/nome-repo'.";
      }

      res.status(status || 500).json({ 
        error: message, 
        details: data?.message || error.message 
      });
    }
  });

  // Github Delete API
  app.delete("/api/delete-from-github", async (req, res) => {
    const { fileName, coupleId } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
    const GITHUB_REPO = process.env.GITHUB_REPO?.trim();

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ error: "Configurazione mancante" });
    }

    try {
      const repoPath = GITHUB_REPO.replace('https://github.com/', '').replace(/\/$/, '');
      const path = `photos/${coupleId}/${fileName}`;
      const url = `https://api.github.com/repos/${repoPath}/contents/${path}`;

      // 1. Get SHA
      const getResponse = await axios.get(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        }
      });

      const sha = getResponse.data.sha;

      // 2. Delete
      await axios.delete(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        data: {
          message: `Eliminazione foto: ${fileName}`,
          sha: sha
        }
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("[GitHub Delete Error]:", error.response?.data || error.message);
      // Even if GitHub delete fails (e.g. file already gone), we might want to proceed with DB delete
      res.status(error.response?.status || 500).json({ 
        error: "Errore durante l'eliminazione da GitHub", 
        details: error.response?.data?.message || error.message 
      });
    }
  });

  // Photo Proxy to serve images from private GitHub repo
  app.get("/api/photo-proxy", async (req, res) => {
    const photoPath = req.query.path as string;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN?.trim();
    const GITHUB_REPO = process.env.GITHUB_REPO?.trim();

    if (!photoPath || !GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(400).send("Path o configurazione mancante");
    }

    try {
      const repoPath = GITHUB_REPO.replace('https://github.com/', '').replace(/\/$/, '');
      const url = `https://api.github.com/repos/${repoPath}/contents/${photoPath}`;
      
      const metadataResponse = await axios.get(url, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        }
      });

      const downloadUrl = metadataResponse.data.download_url;
      
      // Fetch the actual image data
      const imageResponse = await axios.get(downloadUrl, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
        responseType: 'arraybuffer'
      });

      const contentType = imageResponse.headers['content-type'] as string || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(imageResponse.data);
    } catch (error: any) {
      console.error("[Photo Proxy Error]:", error.message);
      res.status(404).send("Immagine non trovata");
    }
  });

  // Config check API
  app.get("/api/github-config-check", (req, res) => {
    res.json({
      configured: !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO),
      repo: process.env.GITHUB_REPO || null
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
