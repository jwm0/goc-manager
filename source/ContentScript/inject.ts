import { Config } from '../types';

console.log('[GOC manager] script injected');

const OVERRIDE_LOCAL_STORAGE_KEY = 'com.databricks.overrideWebappConf';

const getData = () => {
  // @ts-ignore
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

window.addEventListener('message', ({ data }: MessageEvent) => {
  if (data.origin !== 'extension') {
    return;
  }

  console.log({ data });

  switch (data.type) {
    case 'init': {
      // @ts-ignore
      if (window.__GOC_MANAGER__) {
        // @ts-ignore
        window.postMessage({
          type: 'goc-manager-agent',
          ...getData(),
        });
      }
      break;
    }
    case 'set-overrides': {
      const { overrides } = getData();
      const { overridesToRemove, overridesToUpdate } = data.data;
      const updatedOverrides = {
        ...overrides,
        ...overridesToUpdate,
      };

      // remove empty overrides
      Object.keys(overridesToRemove).forEach((key) => {
        delete updatedOverrides[key];
      });

      localStorage.setItem(
        OVERRIDE_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedOverrides)
      );

      window.location.reload();
      break;
    }
    default:
      break;
  }
});
