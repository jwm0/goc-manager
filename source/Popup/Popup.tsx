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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import './styles.scss';
import { Flag, Value } from '../types';

function openWebPage(url: string): Promise<Tabs.Tab> {
  return browser.tabs.create({ url });
}

const getDisplayValue = (value: Value): string => {
  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

function FeatureList({ flags }: { flags: Flag[] }) {
  return (
    <TableContainer>
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

            return (
              <Tr key={flag.name}>
                <Td>{flag.name}</Td>
                <Td>{overridden ? <b>{overriddenValue}*</b> : value}</Td>
                <Td>
                  <ButtonGroup variant="outline" spacing="6">
                    <Button size="xs" colorScheme="teal">
                      Override
                    </Button>
                    <Button size="xs" colorScheme="teal">
                      Reset to default
                    </Button>
                  </ButtonGroup>
                </Td>
              </Tr>
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

  const filteredFlags = flags.filter(({ name }) =>
    name.toLowerCase().includes(search.toLocaleLowerCase())
  );

  const setOverride = (key: string, value: unknown) => {
    // browser.runtime.sendMessage("")
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(
      (message: { type: string; data: Flag[] }) => {
        console.log('popup', message);
        if (message.type === 'goc-manager-agent') {
          setFlags(message.data);
        }
      }
    );
  }, []);

  return (
    <ChakraProvider>
      <section id="popup">
        <h2>GOC manager</h2>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
        <FeatureList flags={filteredFlags} />
        <Button
          onClick={(): Promise<Tabs.Tab> => {
            return openWebPage('options.html');
          }}
        >
          Options Page
        </Button>
      </section>
    </ChakraProvider>
  );
}

const Popup: React.FC = () => {
  return <Root />;
};

export default Popup;
