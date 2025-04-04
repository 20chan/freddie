import 'dotenv/config';

import { readFile, writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import cron from 'node-cron';
import { getFestivalInfo, getFestivalList } from './festival';

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

console.log('WEBHOOK_URL', WEBHOOK_URL);

interface WebhookInput {
  content: string;
  embeds?: Array<{
    url?: string;
    image?: { url: string };
    title?: string;
    description?: string;
  }>;
  files?: Array<{ url: string }>;
}

async function sendDiscordWebhook(input: WebhookInput) {
  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

async function getLastFestivalTitle() {
  try {
    return await readFile('last.txt', 'utf-8');
  } catch {
    return null;
  }
}

async function setLastFestivalTitle(title: string) {
  await writeFile('last.txt', title);
}

async function main() {
  const list = await getFestivalList();

  const lastTitle = await getLastFestivalTitle();

  const lastIndex = list.findIndex(x => x.title === lastTitle);
  if (lastIndex === 0) {
    return;
  }

  const start = lastIndex === -1 ? list.length : lastIndex;

  for (let i = start - 1; i >= 0; i--) {
    const festival = list[i];

    const info = await getFestivalInfo(festival.url);

    await sendDiscordWebhook({
      content: `# ${festival.title}\n${info.join('\n')}`,
      embeds: [
        { image: { url: festival.imgUrl }, url: festival.url, description: festival.url },
      ],
    });
  }

  await setLastFestivalTitle(list[0].title);
}

cron.schedule('* * * * *', main);
