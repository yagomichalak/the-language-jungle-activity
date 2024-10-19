import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;

// Allow express to parse JSON bodies
app.use(express.json());

// Route to exchange authorization code for access_token
app.post("/api/token", async (req, res) => {
  try {
    // Exchange the code for an access_token
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: req.body.code,
        redirect_uri: import.meta.env.VITE_DISCORD_CLIENT_ID,
        scope: "identify guilds applications.commands",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).send(errorData);
    }

    const { access_token } = await response.json();

    // Return the access_token to our client as { access_token: "..."}
    res.send({ access_token });
  } catch (error) {
    console.error("Error during token exchange:", error);
    res.status(500).send("Failed to exchange token");
  }
});

// Route to get the list of audio files from the client/assets/audios folder
app.get("/api/audios", (req, res) => {
  const audioFolderPath = path.join(__dirname, '../client/assets/audios');

  fs.readdir(audioFolderPath, (err, files) => {
    if (err) {
      console.error("Error reading audio files:", err);
      return res.status(500).send("Unable to retrieve audio files");
    }

    // Filter the files to include only .mp3 (or relevant audio) files
    const audioFiles = files.filter(file => file.endsWith(".mp3"));
    res.send(audioFiles);
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
