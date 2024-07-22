# 🤖 buildbot

this repository contains the code for the powerful **buildbot**.

## 📋 features

this bot acts as a global/headless notification system for the nominations game. it works both on **XMTP** and **Farcaster** (via casts on the /build channel and direct casts).

it's extremely scalable due to the usage of **Redis** queues if enabled, allowing the bot to handle multiple requests at the same time without any issues whatsoever.

## 📦 installation

to install the bot, you need to follow these steps:

1. clone the repository

```bash
git clone https://github.com/talentprotocol/buildbot.git
cd buildbot
```

2. install the dependencies using your package manager of choice

```bash
npm install # using npm
yarn install # using yarn
pnpm install # using pnpm
```

3. copy the `.env.example` file to `.env` and fill in the required fields. check the **configuration** section below for more information

```bash
cp .env.example .env
```

4. build and start the bot

```bash
npm run build && npm run start # using npm
yarn build && yarn start # using yarn
pnpm build && pnpm start # using pnpm
```

the bot should be running in the port of your choice (or `3000` if default).

in production enviroments it's better to use a process manager like **PM2** to keep the bot running in the background.

```bash
npm install -g pm2
npm run build && pm2 start dist/index.js --name buildbot # using npm
yarn build && pm2 start dist/index.js --name buildbot # using yarn
pnpm build && pm2 start dist/index.js --name buildbot # using pnpm
```

## ⚙️ configuration

the only configuration needed for this bot is the `.env` file. here's a list of all the required environment variables:

```bash
FARCASTER_API_KEY="" # neynar farcaster API key
FARCASTER_SIGNER_UUID="" # neynar farcaster signer UUID
FARCASTER_CHANNEL_ID="" # /build farcaster channel ID
PORT="3000" # api port (default "3000", can be omitted)
BUILD_API_URL="" # build API URL
WEBHOOK_KEY="" # webhook API key. must be the same one known by the build API
REMINDER_CRON="0 0 * * 3" # cron expression for the reminder job (default "0 0 * * 3", can be omitted)
WEEKLY_STATS_CRON="0 0 * * 0" # cron expression for the weekly stats job (default "0 0 * * 0", can be omitted)
XMTP_ENV="dev" # XMTP environment (default "dev", can be omitted)
ENABLE_JOBS="true" # whether to enable the scheduled jobs or not (default "true", can be omitted)

# BUILDBOT params
BUILDBOT_WARPCAST_API_KEY="wc_secret_567..." # warpcast api key for sending direct casts using buildbot
BUILDBOT_WEBHOOK_NAME="" # name of the webhook for the buildbot (e.g. "buildbot-mentions-webhook") that needs to be published for sending casts and replies
BUILDBOT_WEBHOOK_TARGET_BASE_URL="" # target BASE URL for the webhook (e.g. "https://buildbot.example.com")
BUILDBOT_FARCASTER_FID="" # farcaster fid of the buildbot (used to check mentions)
BUILDBOT_XMTP_PRIVATE_KEY="" # buildbot XMTP private key (used for sending XMTP messages)

# TALENTBOT params
TALENTBOT_WARPCAST_API_KEY="wc_secret_123..." # warpcast api key for sending direct casts using talentbot
TALENTBOT_XMTP_PRIVATE_KEY="" # talentbot XMTP private key (used for sending XMTP messages)
```

if you want to enable the **Redis** queues, you need to add the following environment variables:

```bash
REDIS_HOST="" # redis host
REDIS_PORT="" # redis port
```

this will allow the bot to connect to your Redis instance and start using the queues. if the queues are not enabled, the bot will work as a normal **Express** server and send the messages istantly. **this is not recommended for production environments**.

## 📡 webhooks

the bot uses webhooks to receive messages from the **BUILD API** by using a shared secret. this secret is defined in the `.env` file as `WEBHOOK_KEY`. if a request is made to any of the `/webhooks` endpoints without such key, it will result in a `401 Unauthorized` response.

### `POST /webhooks/mentions`

this endpoint is used to receive nominations from the **BUILD API** and to generate a mention message on XMTP, a direct cast and a cast on the /build channel.

the body of the request should be a JSON object with the following structure:

```json
{
  "points": "", // points used in the nomination
  "nominatorFarcasterId": 0, // farcaster ID of the nominee
  "nomineeFarcasterId": 0 // farcaster ID of the nominator
}
```

## 📨 messages

the bot can be used to send messages through XMTP and Farcaster direct casts. a user receives a message only if they have subscribed to the bot for the given communication channel (direct casts or xmtp).

lets see how to send messages through the bot.

### `POST /messages`

this endpoint is used to send messages through the bot. the body of the request should be a JSON object with the following structure:

```json
{
  "text": "", // text of the message (e.g. "gm!")
  "sender": "", // sender of the message, it determines which bot should send the message (MUST be one of the following: "buildbot", "talentbot")
  "receiver": 1234 || "0x669fd...", // farcaster fid or user's address
  "channels": ["xmtp", "farcaster-dc"] // communication channels where the message should be sent (MUST be an array with at least one of the following: "xmtp", "farcaster-dc")
}
```

### `POST /messages/subscribe`

this endpoint is used to subscribe a user to the bot for a specific communication channel. the body of the request should be a JSON object with the following structure:

subscription to **Farcaster direct casts**:

```json
{
  "channel": "farcaster-dc", // farcaster direct casts
  "fid": 3, // farcaster fid of the user
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

subscription to **XMTP messages**:

```json
{
  "channel": "xmtp", // XMTP messages
  "address": "0x669fd...", // user's address
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

### `POST /messages/unsubscribe`

this endpoint is used to unsubscribe a user from the bot for a specific communication channel. the body of the request should be a JSON object with the following structure:

unsubscription from **Farcaster direct casts**:

```json
{
  "channel": "farcaster-dc", // farcaster direct casts
  "fid": 3, // farcaster fid of the user
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

unsubscription from **XMTP messages**:

```json
{
  "channel": "xmtp", // XMTP messages
  "address": "0x669fd...", // user's address
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

### `GET /messages/is-subscribed`

this endpoint is used to check if a user is subscribed to the bot for a specific communication channel. the body parameters of the request should be a JSON object with the following structure:

checking subscription to **Farcaster direct casts**:

```json
{
  "channel": "farcaster-dc", // farcaster direct casts
  "fid": 3, // farcaster fid of the user
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

checking subscription to **XMTP messages**:

```json
{
  "channel": "xmtp", // XMTP messages
  "address": "0x669fd...", // user's address
  "sender": "buildbot" || "talentbot" // bot that should send the messages
}
```

## 🧳 scheduled jobs

the bot has two scheduled jobs that run at specific times.

### 😅 reminder job

this job runs every Wednesday at midnight and sends a reminder message via XMTP and direct cast to all the users that have any unspent BUILD points to nominate.

you can change the cron expression for this job by changing the `REMINDER_CRON` environment variable.

### 📊 weekly stats job

this job runs every Sunday at midnight and sends a message with the weekly stats of the nominations game via XMTP and direct cast to all the users that participated in that given week.

you can change the cron expression for this job by changing the `WEEKLY_STATS_CRON` environment variable.

## 📝 license

this project is licensed under the **MIT License**. check the [LICENSE.md](/LICENSE.md) file for more information.
