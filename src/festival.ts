import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import { Kind } from './kind';

const urls: Record<Kind, string> = {
  [Kind.K_Concert]: 'https://festivallife.kr/concert',
  [Kind.K_Festival]: 'https://festivallife.kr/festival',
  [Kind.F_Concert]: 'https://festivallife.kr/concert_k',
  [Kind.F_Festival]: 'https://festivallife.kr/festival_o',
}

export async function getFestivalList(kind: Kind) {
  const resp = await fetch(urls[kind]);
  const html = await resp.text();

  const root = parse(html);

  const list = root.querySelectorAll('.list-style .card');

  return list.map(x => {
    const url = 'https://festivallife.kr/' + x.querySelector('a')!.getAttribute('href')!;

    const imgStyle = x.querySelector('.card-thumbnail-wrap')!.getAttribute('style')!;
    const imgUrl = imgStyle.split('url(')[1].split(')')[0];

    const titleElem = x.querySelector('.title')!;
    const title = titleElem.innerText.split('공지')[1].trim().split('\t')[0];

    return {
      url,
      imgUrl,
      title,
    };
  });
}

export async function getFestivalInfo(url: string) {
  const resp = await fetch(url);
  const html = await resp.text();

  const root = parse(html);

  const body = root.querySelector('.board_txt_area')!;

  if (body.querySelectorAll('div').length > 2) {
    return root.querySelectorAll('.board_txt_area > div > div').map(x => x.innerText.replace('&nbsp;', ''));
  } else if (body.querySelectorAll('p').length > 2) {
    return root.querySelectorAll('.board_txt_area p').map(x => x.innerText.replace('&nbsp;', '')).filter(x => x.length > 0);
  } else {
    return root.querySelector('.board_txt_area')!?.innerText.trim().split('\n');
  }
}
