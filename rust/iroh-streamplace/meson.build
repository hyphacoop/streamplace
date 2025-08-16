prog_cargo = find_program('cargo')

if get_option('default_library') == 'shared'
  cargo_cmd = '@0@ build'.format(prog_cargo.full_path())

  iroh_streamplace_dep = custom_target(
    'libiroh_streamplace',
    input: [],
    output: ['libiroh_streamplace.so'],
    command: [
      'sh',
      '-c',
      'cd "@2@/../.." && @0@ && cp "@2@/../../target/debug/libiroh_streamplace.so" "@1@/libiroh_streamplace.so"'.format(cargo_cmd, meson.current_build_dir(), meson.current_source_dir()),
    ],
    build_by_default: true,
  )
else
  cargo_cmd = '@0@ build --release --target-dir "@1@"'.format(prog_cargo.full_path(), meson.current_build_dir())
  archive_dir = meson.current_build_dir()

  triple = meson.get_external_property('RUST_TRIPLE', '')
  if triple != ''
    cargo_cmd += ' --target @0@'.format(triple)
    archive_dir += '/' + triple
  endif

  iroh_streamplace_dep = custom_target(
    'libiroh_streamplace',
    input: [],
    output: ['libiroh_streamplace.a'],
    command: [
      'sh',
      '-c',
      'cd "@2@" && @0@ && cp "@3@/release/libiroh_streamplace.a" "@1@/libiroh_streamplace.a"'.format(cargo_cmd, meson.current_build_dir(), meson.current_source_dir(), archive_dir),
    ],
    build_by_default: true,
  )
endif
