export enum PlayerProtocol {
  PLAYER_PROTOCOL_WEBRTC = "webrtc",
  PLAYER_PROTOCOL_HLS = "hls",
  PLAYER_PROTOCOL_PROGRESSIVE_MP4 = "progressive-mp4",
  PLAYER_PROTOCOL_PROGRESSIVE_WEBM = "progressive-webm",
}
export interface PlayersState {
  [key: string]: PlayerState;
}
export interface PlayerState {
  id: string;
  selectedRendition: string;
  setSelectedRendition: (rendition: string) => void;
  protocol: PlayerProtocol;
  setProtocol: (protocol: PlayerProtocol) => void;

  /** Flag indicating if ingest (stream input) is currently starting */
  ingestStarting: boolean;

  /** Function to set the ingestStarting flag */
  setIngestStarting: (ingestStarting: boolean) => void;

  /** Current connection state of ingest RTP/RTC peer connection */
  ingestConnectionState: RTCPeerConnectionState | null;

  /** Function to update the ingest connection state */
  setIngestConnectionState: (state: RTCPeerConnectionState | null) => void;

  /** Timestamp (number) when ingest started, or null if not started */
  ingestStarted: number | null;

  /** Function to set the ingestStarted timestamp */
  setIngestStarted: (timestamp: number | null) => void;
}
