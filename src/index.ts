import 'dotenv/config';

import { readFile, writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import cron from 'node-cron';
import { getFestivalInfo, getFestivalList } from './festival';
import { Kind, kinds } from './kind';

const K_CONCERT_WEBHOOK_URL = process.env.K_CONCERT_WEBHOOK_URL || '';
const K_FESTIVAL_WEBHOOK_URL = process.env.K_FESTIVAL_WEBHOOK_URL || '';
const FOREIGN_CONCERT_WEBHOOK_URL = process.env.FOREIGN_CONCERT_WEBHOOK_URL || '';
const FOREIGN_FESTIVAL_WEBHOOK_URL = process.env.FOREIGN_FESTIVAL_WEBHOOK_URL || '';

const webhookUrls: Record<Kind, string> = {
  [Kind.K_Concert]: K_CONCERT_WEBHOOK_URL,
  [Kind.K_Festival]: K_FESTIVAL_WEBHOOK_URL,
  [Kind.F_Concert]: FOREIGN_CONCERT_WEBHOOK_URL,
  [Kind.F_Festival]: FOREIGN_FESTIVAL_WEBHOOK_URL,
};

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

async function sendDiscordWebhook(kind: Kind, input: WebhookInput) {
  await fetch(webhookUrls[kind], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

async function getLastFestivalTitle(kind: Kind) {
  try {
    return await readFile(`last-${kind}.txt`, 'utf-8');
  } catch {
    return null;
  }
}

async function setLastFestivalTitle(kind: Kind, title: string) {
  await writeFile(`last-${kind}.txt`, title);
}

async function main() {
  for (const kind of kinds) {
    const list = await getFestivalList(kind);

    const lastTitle = await getLastFestivalTitle(kind);

    const lastIndex = list.findIndex(x => x.title === lastTitle);
    if (lastIndex === 0) {
      continue;
    }

    const start = lastIndex === -1 ? list.length : lastIndex;

    for (let i = start - 1; i >= 0; i--) {
      const festival = list[i];

      const info = await getFestivalInfo(festival.url);

      console.log(kind, festival.title, info);

      await sendDiscordWebhook(kind, {
        content: `# ${festival.title}\n${info.join('\n')}`,
        embeds: [
          { image: { url: festival.imgUrl }, url: festival.url, description: festival.url },
        ],
      });
    }

    await setLastFestivalTitle(kind, list[0].title);
  }
}

cron.schedule('* * * * *', main);
