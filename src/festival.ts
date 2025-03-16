import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

export async function getFestivalList() {
  const resp = await fetch('https://festivallife.kr/concert_k');
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