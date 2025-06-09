export type PlayerProps = {
  name: string;
  playerId?: string;
  src: string;
  muted: boolean;
  telemetry: boolean;
  fullscreen: boolean;
  setFullscreen: (isFullscreen: boolean) => void;
  ingest?: boolean;
  embedded?: boolean;
  videoRef:
    | React.MutableRefObject<HTMLVideoElement | null>
    | ((instance: HTMLVideoElement | null) => void)
    | null
    | undefined;
};
