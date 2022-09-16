import { browser } from 'webextension-polyfill-ts';

export const sendToContentScript = async (message: unknown) => {
  const tabs = await browser.tabs.query({ active: true });
  const tabId = tabs[0].id!;

  return browser.tabs.sendMessage(tabId, message);
};
