# Discord Activity: Getting Started Guide

This template is used in the [Building An Activity](https://discord.com/developers/docs/activities/building-an-activity) tutorial in the Discord Developer Docs.

Read more about building Discord Activities with the Embedded App SDK at [https://discord.com/developers/docs/activities/overview](https://discord.com/developers/docs/activities/overview).

## Running Your Application Through A Network Tunnel
If using cloudflared, you will run the following command, replace {CLIENT_PORT} with your web server's port.

```bash
cloudflared tunnel --url http://localhost:{CLIENT_PORT}
Once you run this command, you will receive your publicly accessible network tunnel address from cloudflared.
```

Once you run this command, you will receive your publicly accessible network tunnel address from cloudflared.
```
Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):
https://funky-jogging-bunny.trycloudflare.com
```
In the Discord Developer Portal, update the Application URL mapping for / url to funky-jogging-bunny.trycloudflare.com to match your network tunnel address and save your changes.

For more informations access: [https://discord.com/developers/docs/activities/development-guides](https://discord.com/developers/docs/activities/development-guides)
