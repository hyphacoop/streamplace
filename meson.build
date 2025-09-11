project(
  'streamplace',
  'c',
  'cpp',
  default_options: {
    'cpp_std': 'c++11',
    'default_library': 'static',
    'auto_features': 'disabled',
    'force_fallback_for': 'gio-2.0,gstreamer-controller-1.0,gstreamer-app-1.0,gstreamer-pbutils-1.0,glib-2.0,gobject-2.0,gio-2.0,gio-unix-2.0,fdk-aac,zlib,libffi,pcre2,intl,proxy-libintl,x264,freetype2,libpng,libjpeg,fontconfig,pango,opus,fribidi,harfbuzz,nettle,cairo,pixman,expat,openssl',
    'buildtype': 'debugoptimized',
    'prefix': meson.current_build_dir(), # otherwise mac meson will try and do /opt/homebrew sometimes
  },
)

fs = import('fs')

prog_go = find_program('go')

flagbuilder = custom_target(
  'flagbuilder',
  input: ['pkg/config/git/git.go'],
  output: ['flagbuilder'],
  command: [prog_go, 'build', '-o', '@OUTPUT0@', '@INPUT@'],
  build_always_stale: true,
  env: {
    'CGO_ENABLED': '0',
  },
)

flags = custom_target(
  'flags',
  input: [],
  output: ['build-flags.go'],
  command: [flagbuilder, '-o', '@OUTPUT0@'],
  build_always_stale: true,
)

version_cmd = run_command(
  prog_go,
  'run',
  'pkg/config/git/git.go',
  '-v',
  check: true,
  env: {
    'CGO_ENABLED': '0',
  },
)
version = version_cmd.stdout().strip()

streamplace_go = custom_target(
  'streamplace.go',
  input: 'cmd/libstreamplace/streamplace.go',
  output: 'streamplace.go',
  command: ['cp', '@INPUT@', '@OUTPUT@'],
)

# todo: teach meson to automatically populate this CPATH thing for go
env = {
  'PKG_CONFIG_PATH': meson.current_build_dir() + '/lib/pkgconfig',
}

GOOS = meson.get_external_property('GOOS', host_machine.system())
GOARCH = meson.get_external_property('GOARCH', host_machine.cpu())
if GOARCH == 'x86_64'
  GOARCH = 'amd64'
endif
if GOARCH == 'aarch64'
  GOARCH = 'arm64'
endif
if meson.is_cross_build()
  env += {
    'GOOS': GOOS,
    'GOARCH': GOARCH,
    'CGO_ENABLED': '1',
    'CC': meson.get_compiler('c', native: false).cmd_array()[0],
  }
endif

c2pa_go_opts = {}
triple = meson.get_external_property('RUST_TRIPLE', '')
if triple != ''
  c2pa_go_opts += {'RUST_TRIPLE': triple}
endif
c2pa_go_proj = subproject(
  'c2pa_go',
  default_options: c2pa_go_opts,
)
c2pa_go_dep = c2pa_go_proj.get_variable('c2pa_go_dep')

streamplace_deps = []
# if host_machine.system() == 'linux'
#   mistserver_proj = subproject(
#     'mistserver',
#     default_options: {
#       'APPNAME': 'MistServer',glib
#     },
#   )
#   mistserver = mistserver_proj.get_variable('libmistserver_dep')
#   streamplace_deps += mistserver
# endif

x264_proj = subproject(
  'x264',
  default_options: {},
)

proxy_libintl_proj = subproject(
  'proxy-libintl',
  default_options: {},
)

ffmpeg_opts = {
  'aac_adtstoasc_bsf': 'enabled',
  'aac_decoder': 'enabled',
  'aac_latm_parser': 'enabled',
  'aac_parser': 'enabled',
  'aformat_filter': 'enabled',
  'aresample_filter': 'enabled',
  'asetnsamples_filter': 'enabled',
  'auto_features': 'enabled',
  'concat_demuxer': 'enabled',
  'concat_filter': 'enabled',
  'concat_protocol': 'enabled',
  'concatf_protocol': 'enabled',
  'extract_extradata_bsf': 'enabled',
  'fd_protocol': 'enabled',
  'fifo_muxer': 'enabled',
  'file_protocol': 'enabled',
  'flac_decoder': 'enabled',
  'flac_demuxer': 'enabled',
  'flac_muxer': 'enabled',
  'flac_parser': 'enabled',
  'flv_demuxer': 'enabled',
  'format_filter': 'enabled',
  'fps_filter': 'enabled',
  'gpl': 'enabled',
  'h264_cuvid_decoder': 'enabled',
  'h264_decoder': 'enabled',
  'h264_metadata_bsf': 'enabled',
  'h264_mp4toannexb_bsf': 'enabled',
  'h264_parser': 'enabled',
  'h264_redundant_pps_bsf': 'enabled',
  'hevc_cuvid_decoder': 'enabled',
  'hevc_mp4toannexb_bsf': 'enabled',
  'hevc_muxer': 'enabled',
  'hevc_parser': 'enabled',
  'hls_muxer': 'enabled',
  'http_protocol': 'enabled',
  'hwdownload_filter': 'enabled',
  'image2_demuxer': 'enabled',
  'libxcb': 'enabled',
  'matroska_audio_muxer': 'enabled',
  'matroska_demuxer': 'enabled',
  'matroska_muxer': 'enabled',
  'mov_demuxer': 'enabled',
  'mp3_decoder': 'enabled',
  'mp3_demuxer': 'enabled',
  'mp3_muxer': 'enabled',
  'mp4_muxer': 'enabled',
  'mpegaudio_parser': 'enabled',
  'mpegts_demuxer': 'enabled',
  'mpegts_muxer': 'enabled',
  'network': 'enabled',
  'null_muxer': 'enabled',
  'opus_decoder': 'enabled',
  'opus_parser': 'enabled',
  'pipe_protocol': 'enabled',
  'png_decoder': 'enabled',
  'png_parser': 'enabled',
  'rtmp_protocol': 'enabled',
  'scale_filter': 'enabled',
  'segment_muxer': 'enabled',
  'stream_segment_muxer': 'enabled',
  'select_filter': 'enabled',
  'signature_filter': 'enabled',
  'tcp_protocol': 'enabled',
  'vorbis_decoder': 'enabled',
  'vorbis_parser': 'enabled',
  'vp8_cuvid_decoder': 'enabled',
  'vp8_parser': 'enabled',
  'vp9_cuvid_decoder': 'enabled',
  'vp9_parser': 'enabled',
  'wav_demuxer': 'enabled',
  'wav_muxer': 'enabled',
  'webm_muxer': 'enabled',
  'x86asm': 'enabled',
  'mov_muxer': 'enabled',
  'vp9_superframe_bsf': 'enabled',
  'ac3_parser': 'enabled',
  'pgs_frame_merge_bsf': 'enabled',
  'libx264': 'enabled',
  'libx264_encoder': 'enabled',
  'libx264rgb_encoder': 'enabled',
  'mpegtsraw_demuxer': 'enabled',
  'adts_muxer': 'enabled',
  'latm_muxer': 'enabled',
  'vvc_mp4toannexb_bsf': 'enabled',
}

if host_machine.system() != 'windows'
  ffmpeg_opts += {'nanosleep': 'enabled'}
endif

# Someday maybe once the meson port of ffmpeg supports cuda

# if host_machine.system() != 'darwin'
#   ffmpeg_opts += {
#     'ff_cuda_llvm': 'enabled',
#     'cuda': 'enabled',
#     'hwupload_cuda_filter': 'enabled',
#     'scale_cuda_filter': 'enabled',
#     # 'signature_cuda_filter': 'enabled',
#     'ffnvcodec': 'enabled',
#     'h264_nvenc_encoder': 'enabled',
#     'nvenc': 'enabled',
#     'nvdec': 'enabled',
#     'h264_nvdec_hwaccel': 'enabled',
#     'libdl': 'enabled',
#   }
# endif

ffmpeg_proj = subproject(
  'FFmpeg',
  # vvc seems to have problems building as a submodule?
  default_options: ffmpeg_opts,
)
avformat = ffmpeg_proj.get_variable('libavformat_dep')
avfilter = ffmpeg_proj.get_variable('libavfilter_dep')
streamplace_deps += [avformat, avfilter]

gstreamer_proj = subproject(
  'gstreamer-full',
  default_options: {},
)

streamplace_deps += [
  dependency('gio-2.0'),
  dependency('gstreamer-controller-1.0'),
  dependency('gstreamer-app-1.0'),
  dependency('gstreamer-pbutils-1.0'),
]

atproto = subproject(
  'atproto',
  default_options: {},
)

if get_option('default_library') == 'static'
  gst_full_dep = gstreamer_proj.get_variable('gst_full_dep')
  streamplace_deps += [
    gst_full_dep,
    dependency('gstplayback'),
  ]
endif

subdir('rust/iroh-streamplace')

if host_machine.system() == 'darwin'
  streamplace_deps += [
    dependency(
      'appleframeworks',
      modules: ['CoreFoundation', 'Security', 'SystemConfiguration'],
    ),
  ]
endif
if host_machine.system() == 'windows'
  add_project_link_arguments(
    [
      '-lntdll',
      '-luserenv',
      '-lcrypt32',
      '-lbcrypt',
      '-static-libstdc++',
      '-static-libgcc',
    ],
    language: ['c', 'cpp'],
  )
endif

pkg = import('pkgconfig')
pkg.generate(
  name: 'streamplacedeps',
  libraries: [streamplace_deps, c2pa_go_dep, iroh_streamplace_dep],
  description: 'all streamplace dependencies bundled for easy inclusion',
)

streamplacedeps = executable(
  'streamplacedeps',
  ['cmd/streamplace/empty.c'],
  dependencies: [
    streamplace_deps,
  ],
  link_with: [c2pa_go_dep, iroh_streamplace_dep],
)
