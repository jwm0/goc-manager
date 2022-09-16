import * as React from 'react';
import { browser, Tabs } from 'webextension-polyfill-ts';
import {
  ChakraProvider,
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Button,
  ButtonGroup,
  Input,
  Heading,
  Divider,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { sendToContentScript } from '../messages';
import './styles.scss';
import { Config, Flag, Value } from '../types';

function openWebPage(url: string): Promise<Tabs.Tab> {
  return browser.tabs.create({ url });
}

const getDisplayValue = (value: Value): string => {
  if (typeof value === 'undefined') {
    return '';
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const getParsedValue = (value: string, fallbackValue: unknown): unknown => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  try {
    return JSON.parse(value);
  } catch (e) {
    return fallbackValue;
  }
};

function FlagRow({
  name,
  overridden,
  value,
  overriddenValue,
  unsavedValue,
  setOverride,
}: {
  name: string;
  overridden: boolean;
  value: string;
  overriddenValue: string;
  unsavedValue?: string;
  setOverride: (key: string, value: Value) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localOverride, setLocalOverride] = useState<string>();
  const currentValue = overridden ? overriddenValue : value;

  const displayValue = () => {
    if (unsavedValue) {
      return <b>{unsavedValue}*</b>;
    }

    if (overridden) {
      return <b>{currentValue}</b>;
    }

    return currentValue;
  };

  const handleEdit = () => {
    if (editing) {
      if (localOverride) {
        const parsedValue = getParsedValue(localOverride, currentValue);
        setOverride(name, parsedValue);
      }
      setEditing(false);
    } else {
      setEditing(true);
    }
  };

  return (
    <Tr>
      <Td>{name}</Td>
      <Td
        css={{
          minWidth: 200,
          maxWidth: 200,
          textOverflow: 'ellipsis',
          overflow: 'hidden',
        }}
      >
        {editing ? (
          <Input
            placeholder={currentValue}
            value={localOverride}
            onChange={(e) => setLocalOverride(e.target.value)}
          />
        ) : (
          displayValue()
        )}
      </Td>
      <Td>
        <ButtonGroup variant="outline" spacing="6">
          <Button size="xs" colorScheme="teal" onClick={handleEdit}>
            Edit
          </Button>
          {overridden && (
            <Button
              size="xs"
              colorScheme="teal"
              onClick={() => setOverride(name, undefined)}
            >
              Reset to default
            </Button>
          )}
        </ButtonGroup>
      </Td>
    </Tr>
  );
}

function FeatureList({
  flags,
  localOverrides,
  setOverride,
}: {
  flags: Flag[];
  localOverrides: Config | undefined;
  setOverride: (key: string, value: Value) => void;
}) {
  return (
    <TableContainer minHeight={250} maxHeight={250} overflowY="scroll">
      <Table variant="striped" size="sm">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Value</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {flags.map((flag) => {
            const overridden = typeof flag.overriddenValue !== 'undefined';
            const value = getDisplayValue(flag.value);
            const overriddenValue = getDisplayValue(flag.overriddenValue);
            const unsavedValue = getDisplayValue(localOverrides?.[flag.name]);

            return (
              <FlagRow
                key={flag.name}
                name={flag.name}
                overridden={overridden}
                value={value}
                overriddenValue={overriddenValue}
                setOverride={setOverride}
                unsavedValue={
                  Object.hasOwn(localOverrides || {}, flag.name)
                    ? unsavedValue
                    : undefined
                }
              />
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function Root() {
  const [search, setSearch] = useState('');
  const [flags, setFlags] = useState<Flag[]>([]);
  const [unsavedOverrides, setUnsavedOverrides] = useState<Config>();

  const filteredFlags = flags.filter(({ name }) =>
    name.toLowerCase().includes(search.toLocaleLowerCase())
  );

  const setOverride = (key: string, value: unknown) => {
    setUnsavedOverrides((overrides) => ({
      ...overrides,
      [key]: value,
    }));
  };

  const submit = () => {
    if (!unsavedOverrides) {
      return;
    }
    const overridesToRemove: Record<string, true> = {};

    Object.keys(unsavedOverrides).forEach((key) => {
      if (unsavedOverrides[key] === undefined) {
        overridesToRemove[key] = true;
      }
    });

    sendToContentScript({
      origin: 'extension',
      type: 'set-overrides',
      data: { overridesToRemove, overridesToUpdate: unsavedOverrides },
    });
  };

  const init = () => {
    sendToContentScript({
      origin: 'extension',
      type: 'init',
    });
  };

  useEffect(() => {
    init();

    const handler = (message: { type: string; data: Flag[] }) => {
      if (message.type === 'goc-manager-agent') {
        setFlags(message.data);
      }
    };

    browser.runtime.onMessage.addListener(handler);

    return () => {
      browser.runtime.onMessage.removeListener(handler);
    };
  }, []);

  return (
    <ChakraProvider>
      <section id="popup">
        <Heading size="lg" colorScheme="teal" marginBottom={5}>
          Config manager
        </Heading>
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          css={{ marginBottom: 10 }}
        />
        <FeatureList
          flags={filteredFlags}
          setOverride={setOverride}
          localOverrides={unsavedOverrides}
        />
        <Divider marginBottom={5} />
        <Button
          onClick={submit}
          colorScheme="teal"
          disabled={!unsavedOverrides}
        >
          Apply and reload
        </Button>
      </section>
    </ChakraProvider>
  );
}

const Popup: React.FC = () => {
  return <Root />;
};

export default Popup;
