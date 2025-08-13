export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const randomPort = () => Math.floor(Math.random() * 20000) + 20000;

export type PlayerReport = {
  whatHappened: { [k: string]: number };
  avSync?: {
    min: number;
    max: number;
    avg: number;
  };
  retries?: number;
};
