import { Config } from '../types';

console.log('[Flags manager] script injected');

interface Window {
  __GOC_MANAGER__: {
    getState(): Config;
  };
}

const OVERRIDE_LOCAL_STORAGE_KEY = 'com.databricks.overrideWebappConf';

const getData = () => {
  const data = window.__GOC_MANAGER__.getState();
  const overrides = window.localStorage.getItem(OVERRIDE_LOCAL_STORAGE_KEY);

  let parsedOverrides: Config = {};

  if (overrides) {
    try {
      parsedOverrides = JSON.parse(overrides);
    } catch (e) {
      console.warn(
        `Could not parse overrides at localStorage.getItem('${OVERRIDE_LOCAL_STORAGE_KEY}')`
      );
    }
  }

  return {
    data,
    overrides: parsedOverrides,
  };
};

// TODO: listen for message
setTimeout(() => {
  if (window.__GOC_MANAGER__) {
    window.postMessage({
      type: 'goc-manager-agent',
      ...getData(),
    });
  }
}, 5000);
