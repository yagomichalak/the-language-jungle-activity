import { DiscordSDK } from "@discord/embedded-app-sdk";

import botLogo from './assets/images/icons/bot_icon.png';
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

let currentRound = 0;
let countDownInSecs = 5;
let maxRounds = 10;
let maxAttempts = 3;
let remainingAttempts = maxAttempts;
let audioFiles = [];
let currentAudio = null;
let audioElement = null;
let isGameOver = false;

const correctAnswerAudio = new Audio('./assets/audios/SFX/correct_answer.mp3'); // Replace with the correct file path
const wrongAnswerAudio = new Audio('./assets/audios/SFX/wrong_answer.mp3');

// Render the initial UI (with logo and title)
function renderInitialUI() {
  document.querySelector('#app').innerHTML = `
    <div>
      <img src="${botLogo}" class="logo" alt="The Language Jungle" />
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

async function fetchAudioFiles(times) {
  audioFiles = [
    { language: "Czech", path: "Czech/Czech_1.mp3" },
    { language: "Flemish", path: "Flemish/Flemish_1.mp3" },
    { language: "French", path: "French/French_1.mp3" },
    { language: "Swedish", path: "Swedish/Swedish_1.mp3" },
    { language: "Polish", path: "Polish/Polish_1.mp3" },
    { language: "Romanian", path: "Romanian/Romanian_1.mp3" },
    { language: "Spanish", path: "Spanish/Spanish_1.mp3" },
    { language: "Italian", path: "Italian/Italian_1.mp3" },
    { language: "Centish", path: "Centish/Centish_1.mp3" },
    { language: "Silesian", path: "Silesian/Silesian_1.mp3" },
  ]
  // audioFiles = []; // Clear the array to accumulate new files
  
  // for (let i = 0; i < times; i++) {
  //   try {
  //     // const response = await fetch("/api/audios");
  //     // const newAudioFile = await response.json(); // Fetch the response as JSON
  //     console.log("heyy")
  //     const newAudioFile = await getRandomLanguageAudio(); // Fetch the response as JSON
  //     console.log("newAudioFile", newAudioFile)

  //     if (!newAudioFile.audio) {
  //       throw new Error("No audio file returned from the server");
  //     }

  //     // Accumulate the fetched audio file(s)
  //     audioFiles.push(newAudioFile);
  //   } catch (error) {
  //     console.error(`Error fetching audio file on attempt ${i + 1}:`, error);
  //   }
  // }

  // if (audioFiles.length === 0) {
  //   throw new Error("No audio files available after all attempts");
  // }
}

async function startGame() {
  await fetchAudioFiles(maxRounds);
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

  showCountdown(countDownInSecs, startAudioPlayback);
}

function startAudioPlayback() {
  const randomIndex = Math.floor(Math.random() * audioFiles.length);
  const currentAudioObj = audioFiles[randomIndex];
  currentAudio = currentAudioObj.path;

  document.querySelector('#app').innerHTML = `
    <h2>Round ${currentRound}</h2>
    <p>Guess the language after the audio finishes!</p>
    <p>Attempts left: ${remainingAttempts}</p>
    <p id="timer"></p>
    <p id="audioDuration">Audio: 0:00 / 0:00</p> <!-- Placeholder for audio duration -->
    <input id="languageInput" type="text" disabled />
  `;

  audioElement = new Audio(`./assets/audios/languages/${currentAudio}`);
  audioElement.loop = false

  // Update the total duration of the audio when metadata is loaded
  audioElement.addEventListener('loadedmetadata', () => {
    const totalDuration = formatTime(audioElement.duration);
    document.querySelector('#audioDuration').textContent = `Audio: 0:00 / ${totalDuration}`;
  });

  // Update the current time as the audio plays
  audioElement.addEventListener('timeupdate', () => {
    const currentTime = formatTime(audioElement.currentTime);
    const totalDuration = formatTime(audioElement.duration);
    document.querySelector('#audioDuration').textContent = `Audio: ${currentTime} / ${totalDuration}`;
  });

  audioElement.play();
  audioElement.onended = () => {
    document.querySelector("#languageInput").disabled = false;
    document.querySelector("#languageInput").focus();
  };

  // Add listener to handle input validation after the audio finishes
  document.querySelector('#languageInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      checkAnswer(event.target.value, currentAudioObj.language);
    }
  });
}

// Utility function to format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < countDownInSecs ? '0' : ''}${remainingSeconds}`;
}

function checkAnswer(userInput, answer) {
  const correctAnswer = answer; // The file name without extension
  if (userInput.trim().toLowerCase() === correctAnswer.toLowerCase()) {
    correctAnswerAudio.play();

    // After the audio finishes playing, go to the next round
    correctAnswerAudio.onended = () => {
      nextRound(); // Proceed to the next round after audio finishes
    };
  } else {
    remainingAttempts--;
    document.querySelector('#app').innerHTML += `
      <p>Wrong guess! The correct answer was: <strong>${correctAnswer}</strong></p>
    `;
    // Play the wrong answer audio
    wrongAnswerAudio.play();

    // Handle the case where there are no attempts left
    if (remainingAttempts <= 0) {
      wrongAnswerAudio.onended = () => {
        endGame(false); // End the game after the wrong answer audio finishes
      };
    } else {
      wrongAnswerAudio.onended = () => {
        document.querySelector("#languageInput").value = ""; // Reset the input field
        document.querySelector('#app').querySelector("p:nth-of-type(2)").textContent = `Attempts left: ${remainingAttempts}`; // Update attempts left
        nextRound(); // Go to the next round after wrong answer audio finishes
      };
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
