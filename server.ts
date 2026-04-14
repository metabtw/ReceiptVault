import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes (Mocking Supabase Edge Functions)
  app.post("/api/process-receipt", async (req, res) => {
    try {
      const { imageUrl, userId, base64Image } = req.body;
      
      // In a real app, we would call Vision API and OpenAI here.
      // For this preview, we'll mock the response to avoid needing API keys.
      console.log(`Processing receipt for user ${userId}`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return mock success
      res.json({
        success: true,
        receiptId: "mock-receipt-id-" + Date.now(),
        warrantyItemId: "mock-warranty-id-" + Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
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
