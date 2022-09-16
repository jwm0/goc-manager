export type Value = unknown;

export type Config = Record<string, unknown>;

export type Flag = {
  name: string;
  value: Value;
  overriddenValue: Value;
};

export type Message = {
  type: string;
  data: Config;
  overrides: Config;
};
