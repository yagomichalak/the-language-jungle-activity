import { DiscordSDK } from "@discord/embedded-app-sdk";

import rocketLogo from './assets/images/bot_icon.png';
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

let currentRound = 0;
let maxRounds = 10;
let maxAttempts = 3;
let remainingAttempts = maxAttempts;
let audioFiles = [];
let currentAudio = null;
let audioElement = null;
let isGameOver = false;

// Render the initial UI (with logo and title)
function renderInitialUI() {
  document.querySelector('#app').innerHTML = `
    <div>
      <img src="${rocketLogo}" class="logo" alt="The Language Jungle" />
      <h1>The Language Jungle</h1>
      <p>Get ready to test your language skills in this game!</p>
    </div>
  `;
}

// Discord SDK initialization
setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");
  // appendVoiceChannelName();
  // appendGuildAvatar();
  // // Now that the SDK is ready, play background music
  // playBackgroundMusic();
  renderInitialUI();  // Show the initial UI with the logo and title
  // updatePresence();
  startGame();        // Ensure the game starts here
});


async function appendVoiceChannelName() {
  const app = document.querySelector('#app');

  let activityChannelName = 'Unknown';

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

async function appendGuildAvatar() {
  const app = document.querySelector('#app');

  // 1. From the HTTP API fetch a list of all of the user's guilds
  const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
    headers: {
      // NOTE: we're using the access_token provided by the "authenticate" command
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  // 3. Append to the UI an img tag with the related information
  if (currentGuild != null) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute(
      'src',
      // More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
      `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
    );
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
  }
}

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  console.log("yesss")
  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });

  console.log("gimme code: ")
  return

  // Retrieve an access_token from your activity's server
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();
  console.log("access tokenenenene: ", access_token);

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

function playBackgroundMusic() {
  // Create and configure an audio element
  const backgroundMusic = new Audio('./assets/soundtracks/multiplayer_theme.mp3'); // Path to your music file
  backgroundMusic.loop = false; // Set to loop the music

  // Play the audio only when the user has interacted with the page, following browser autoplay rules
  document.addEventListener('click', () => {
    backgroundMusic.play().catch(error => {
      console.error("Music playback failed:", error);
    });
  }, { once: true }); // Ensure it runs only once
}

async function fetchAudioFiles() {
  audioFiles = [
    "bluetooth.mp3", "Cala_bouuuca.mp3", "Disgusting_3.mp3",
    "flamengo.mp3", "money.mp3", "whip.mp3"
  ]
  // const response = await fetch("/api/audios");
  // audioFiles = await response.json();
  // if (audioFiles.length === 0) {
  //   throw new Error("No audio files available");
  // }
}

async function startGame() {
  await fetchAudioFiles();
  currentRound = 0;
  remainingAttempts = maxAttempts;
  isGameOver = false;
  document.querySelector('#app').innerHTML += `<h2>Game starting!</h2>`;
  // startAudioPlayback();
  nextRound();
}

function nextRound() {
  if (currentRound >= maxRounds || isGameOver) {
    endGame(true);
    return;
  }

  currentRound++;

  document.querySelector('#app').innerHTML = `
    <h2>Round ${currentRound}</h2>
    <p>Get ready! The audio will play after the countdown.</p>
    <p>Attempts left: ${remainingAttempts}</p>
    <p id="timer"></p> <!-- Ensure the timer element is present in the UI -->
  `;
  
  showCountdown(10, startAudioPlayback);
}

function startAudioPlayback() {
  const randomIndex = Math.floor(Math.random() * audioFiles.length);
  currentAudio = audioFiles[randomIndex];

  document.querySelector('#app').innerHTML = `
    <h2>Round ${currentRound}</h2>
    <p>Guess the language after the audio finishes!</p>
    <p>Attempts left: ${remainingAttempts}</p>
    <p id="timer"></p>
    <input id="languageInput" type="text" disabled />
  `;

  audioElement = new Audio(`./assets/audios/${currentAudio}`);
  audioElement.loop = false
  audioElement.play();
  audioElement.onended = () => {
    document.querySelector("#languageInput").disabled = false;
    document.querySelector("#languageInput").focus();
  };

  // Add listener to handle input validation after the audio finishes
  document.querySelector('#languageInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      checkAnswer(event.target.value);
    }
  });
}

function checkAnswer(userInput) {
  const correctAnswer = currentAudio.split(".")[0]; // The file name without extension
  if (userInput.trim().toLowerCase() === correctAnswer.toLowerCase()) {
    nextRound();
  } else {
    remainingAttempts--;
    document.querySelector('#app').innerHTML += `
      <p>Wrong guess! The correct answer was: <strong>${correctAnswer}</strong></p>
    `;
    if (remainingAttempts <= 0) {
      endGame(false);
    } else {
      document.querySelector("#languageInput").value = "";
      document.querySelector('#app').querySelector("p:nth-of-type(2)").textContent = `Attempts left: ${remainingAttempts}`;
    }
  }
}

function endGame(won) {
  isGameOver = true;
  document.querySelector('#app').innerHTML = `
    <h2>${won ? "You Won!" : "Game Over!"}</h2>
    <button id="restartGame">Restart</button>
  `;

  document.querySelector('#restartGame').addEventListener('click', startGame);
}

function showCountdown(seconds, callback) {
  const timer = document.querySelector('#app').querySelector("#timer");
  let counter = seconds;

  const interval = setInterval(() => {
    timer.textContent = `Next round in: ${counter} seconds`;
    counter--;

    if (counter < 0) {
      clearInterval(interval);
      callback();
    }
  }, 1000);
}

async function updatePresence() {
  await discordSdk.commands.setActivity({
    state: "Playing Solo", // What you're currently doing
    details: `Round ${currentRound}`, // Show current round
    timestamps: {
      start: new Date().getTime(), // Activity start time
    },
    assets: {
      large_image: "slothbot_games", // Image key
      large_text: "Playing Language Game", // Tooltip text
    },
    party: {
      id: "language-game-party", // Party ID for tracking the game session
      size: currentRound, // Current round/party size
      max: maxRounds // Max rounds/party size
    }
  });

  console.log("Discord presence updated");
}
// renderInitialUI();
// startGame();