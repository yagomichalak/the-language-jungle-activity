import { DiscordSDK } from "@discord/embedded-app-sdk";

import rocketLogo from './assets/images/bot_icon.png';
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");
  appendVoiceChannelName();
  appendGuildAvatar();
  // Now that the SDK is ready, play background music
  playBackgroundMusic();
  // updatePresence();
  // We can now make API calls within the scopes we requested in setupDiscordSDK()
  // Note: the access_token returned is a sensitive secret and should be treated as such
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

  // Retrieve an access_token from your activity's server
  // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
  // Read more about constructing a full URL and using external resources at
  // https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

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

async function updatePresence() {
  // Setting the activity/presence
  await discordSdk.commands.setActivity({
    state: "Playing Solo", // What you're currently doing
    details: "Competitive", // Description/details of the activity
    timestamps: {
      start: new Date(1507665886000), // Starting time (Unix timestamp in milliseconds)
      end: new Date(1507665886000) // Starting time (Unix timestamp in milliseconds)
    },
    assets: {
      large_image: "slothbot_games", // Key for the large image
      large_text: "The Language Sloth", // Tooltip text for the large image
      small_image: "slothbot_games", // Key for the small image
      small_text: "The Language Sloth", // Tooltip text for the small image
    },
    party: {
      id: "ae488379-351d-4a4f-ad32-2b9b01c91657", // Party ID (for multi-user activities)
      size: 1, // Current size of the party
      max: 5 // Max size of the party
    },
    secrets: {
      join: "MTI4NzM0OjFpMmhuZToxMjMxMjM=", // Secret for joining the activity
    }
  });

  console.log("Discord presence updated");
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" alt="The Language Jungle" />
    <h1>The Language Jungle</h1>
  </div>
`;
