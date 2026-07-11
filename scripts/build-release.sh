#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugin_slug="said-dunn-site-enhancements"
output_path="${1:-${project_root}/${plugin_slug}.zip}"

if [[ ! -f "${project_root}/${plugin_slug}/${plugin_slug}.php" ]]; then
	printf 'Plugin bootstrap was not found.\n' >&2
	exit 1
fi

rm -f "${output_path}"

(
	cd "${project_root}"
	zip -q -r -9 "${output_path}" "${plugin_slug}"
)

unzip -q -t "${output_path}"
printf 'Built %s\n' "${output_path}"
