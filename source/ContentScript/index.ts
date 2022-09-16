import { browser } from 'webextension-polyfill-ts';
import { Config, Flag, Message } from '../types';

console.log('helloworld from content script');

const script = document.createElement('script');
script.src = browser.runtime.getURL('js/inject.bundle.js');
(document.head || document.documentElement).appendChild(script);

const getMappedData = ({
  data,
  overrides,
}: {
  data: Config;
  overrides: Config;
}): Flag[] =>
  Object.entries(data).map(([name, value]) => ({
    name,
    value,
    overriddenValue: overrides[name],
  }));

// listen
window.addEventListener('message', ({ data }: MessageEvent<Message>) => {
  if (data.type === 'goc-manager-agent') {
    console.log('message received in contentscript:', data);
    const mappedData = getMappedData({
      data: data.data,
      overrides: data.overrides,
    });
    browser.runtime.sendMessage({ type: data.type, data: mappedData });
  }
});

browser.runtime.onMessage.addListener(
  (message: { type: string; origin: string }) => {
    console.log('catch and forward', message);
    if (message.origin === 'extension') {
      window.postMessage(message);
    }
  }
);

// create panel
browser.devtools.panels.create(
  'GOC manager',
  'assets/icons/favicon-32.png',
  'popup.html'
);

export {};
