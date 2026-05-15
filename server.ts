
import express from "express";
import path from "path";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

  // Helper to find Vercel/Environment keys with loose naming
  const getGitConfig = () => {
    const env = process.env;
    
    // Debug logging for Vercel troubleshooting
    if (env.VERCEL) {
      console.log("--- ENV DEBUG VERCEL ---");
      console.log("GITHUB_TOKEN:", !!env.GITHUB_TOKEN);
      console.log("GIT_TOKEN:", !!env.GIT_TOKEN);
      console.log("GH_TOKEN:", !!env.GH_TOKEN);
      console.log("GITHUB_REPO:", env.GITHUB_REPO || "Not set");
      console.log("GITHUB_REPOSITORY:", env.GITHUB_REPOSITORY || "Not set");
      console.log("REPOSITORIO_GITHUB:", env.REPOSITORIO_GITHUB || "Not set");
      console.log("------------------------");
    }
    
    // Look for Token
    const token = (
      env.GITHUB_TOKEN || 
      env.GIT_TOKEN || 
      env.GH_TOKEN ||
      env.token || 
      env.GITHUB_CHIAVE || 
      ""
    ).trim();

    // Look for Repo
    const repo = (
      env.GITHUB_REPO || 
      env.GITHUB_REPOSITORY || 
      env.REPOSITORIO_GITHUB || 
      env.REPOSITIVO_GITHUB || 
      env.repo ||
      ""
    ).trim();

    if (env.VERCEL) {
      console.log(`[GitConfig Check] Token Found: ${!!token}, Repo: ${repo}`);
    }

    return { token, repo };
  };

  // GitHub Upload API
  app.post("/api/upload-to-github", async (req, res) => {
    const { fileName, content, coupleId } = req.body;
    const { token: GITHUB_TOKEN, repo: GITHUB_REPO } = getGitConfig();

    if (!fileName || !coupleId) {
      console.error("[GitHub Upload] Error: Missing fileName or coupleId in request body");
      return res.status(400).json({ error: "Dati mancanti nella richiesta" });
    }

    console.log(`[GitHub Upload] Attempting upload - Couple: ${coupleId}, File: ${fileName}, Token: ${!!GITHUB_TOKEN}`);

    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      return res.status(500).json({ 
        error: "Configurazione GitHub mancante", 
        details: "Assicurati di aver impostato GITHUB_TOKEN e GITHUB_REPO nelle variabili d'ambiente di Vercel e di aver effettuato un Redeploy." 
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
    const { token: GITHUB_TOKEN, repo: GITHUB_REPO } = getGitConfig();

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
    const { token: GITHUB_TOKEN, repo: GITHUB_REPO } = getGitConfig();

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
    const { token, repo } = getGitConfig();
    
    const status = {
      token_found: token.length > 0,
      repo_found: repo.length > 0,
      repo_name: repo || null,
      platform: process.env.VERCEL ? "Vercel" : "AI Studio"
    };

    console.log("[Config Check Result]:", status);
    
    res.json({
      configured: status.token_found && status.repo_found,
      ...status
    });
  });

  // Handles serving the app
  const setupProduction = () => {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  };

  if (process.env.NODE_ENV !== "production") {
    const startDev = async () => {
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Server running on http://localhost:${PORT}`);
        });
      } catch (e) {
        console.error("Vite Dev Server Error:", e);
      }
    };
    startDev();
  } else if (!process.env.VERCEL) {
    // Production but NOT Vercel (e.g. Docker/Local Prod)
    setupProduction();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    // On Vercel, we don't call app.listen() and don't need setupProduction()
    // because Vercel handles the static files via vercel.json routes
    console.log("Running in Vercel Serverless environment");
  }

export default app;
