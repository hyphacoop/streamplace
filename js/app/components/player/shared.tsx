import useStreamplaceNode from "hooks/useStreamplaceNode";
import { useMemo } from "react";

const PROTOCOL_HLS = "hls";
const PROTOCOL_PROGRESSIVE_MP4 = "progressive-mp4";
const PROTOCOL_PROGRESSIVE_WEBM = "progressive-webm";
const PROTOCOL_WEBRTC = "webrtc";

const protocolSuffixes = {
  m3u8: PROTOCOL_HLS,
  mp4: PROTOCOL_PROGRESSIVE_MP4,
  webm: PROTOCOL_PROGRESSIVE_WEBM,
  webrtc: PROTOCOL_WEBRTC,
};

export function srcToUrl(
  props: {
    src: string;
    selectedRendition?: string;
  },
  protocol: string,
): {
  url: string;
  protocol: string;
} {
  const { url } = useStreamplaceNode();
  return useMemo(() => {
    if (props.src.startsWith("http://") || props.src.startsWith("https://")) {
      const segments = props.src.split(/[./]/);
      const suffix = segments[segments.length - 1];
      if (protocolSuffixes[suffix]) {
        return {
          url: props.src,
          protocol: protocolSuffixes[suffix],
        };
      } else {
        throw new Error(`unknown playback protocol: ${suffix}`);
      }
    }
    let outUrl: string;
    if (protocol === PROTOCOL_HLS) {
      if (props.selectedRendition === "auto") {
        outUrl = `${url}/api/playback/${props.src}/hls/index.m3u8`;
      } else {
        outUrl = `${url}/api/playback/${props.src}/hls/index.m3u8?rendition=${props.selectedRendition || "source"}`;
      }
    } else if (protocol === PROTOCOL_PROGRESSIVE_MP4) {
      outUrl = `${url}/api/playback/${props.src}/stream.mp4`;
    } else if (protocol === PROTOCOL_PROGRESSIVE_WEBM) {
      outUrl = `${url}/api/playback/${props.src}/stream.webm`;
    } else if (protocol === PROTOCOL_WEBRTC) {
      outUrl = `${url}/api/playback/${props.src}/webrtc?rendition=${props.selectedRendition || "source"}`;
    } else {
      throw new Error(`unknown playback protocol: ${protocol}`);
    }
    return {
      protocol: protocol,
      url: outUrl,
    };
  }, [props.src, props.selectedRendition, protocol, url]);
}
