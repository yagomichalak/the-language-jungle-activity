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

// Route to get a random audio file from a random language folder
app.get("/api/audios", (req, res) => {
  const languagesFolderPath = path.join(__dirname, '../client/assets/audios/languages');

  // Read the languages folder to get a list of subdirectories (each representing a language)
  fs.readdir(languagesFolderPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error("Error reading languages folders:", err);
      return res.status(500).send("Unable to retrieve languages folders");
    }

    // Filter the directories to ensure we only pick folders
    const languageFolders = files.filter(file => file.isDirectory()).map(dir => dir.name);

    if (languageFolders.length === 0) {
      return res.status(404).send("No language folders found");
    }

    // Select a random language folder
    const randomLanguageFolder = languageFolders[Math.floor(Math.random() * languageFolders.length)];
    const selectedLanguagePath = path.join(languagesFolderPath, randomLanguageFolder);

    // Read the selected language folder to get a list of audio files
    fs.readdir(selectedLanguagePath, (err, audioFiles) => {
      if (err) {
        console.error("Error reading audio files in the selected language folder:", err);
        return res.status(500).send("Unable to retrieve audio files from the selected language folder");
      }

      // Filter the files to include only .mp3 files
      const mp3Files = audioFiles.filter(file => file.endsWith(".mp3"));

      if (mp3Files.length === 0) {
        return res.status(404).send(`No audio files found in the ${randomLanguageFolder} folder`);
      }

      // Select a random .mp3 file from the folder
      const randomAudioFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
      const audioFilePath = path.join(selectedLanguagePath, randomAudioFile);

      // Respond with the selected random audio file path (relative to the client/assets/audios directory)
      res.send({
        language: randomLanguageFolder,
        audio: audioFilePath,
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
