#!/usr/bin/env bash

set -eu

usage() {
  cat <<'EOF'
Usage:
  scripts/scan-rxlogger.sh <log_folder> [output_dir] [prefix]

Arguments:
  log_folder  Required. Path to RxLogger-style folder.
  output_dir  Optional. Defaults to analysis
  prefix      Optional. Defaults to rxlogger_scan

Outputs:
  <output_dir>/<prefix>_analysis_summary.csv
  <output_dir>/<prefix>_observations_summary.csv
  <output_dir>/<prefix>_quodix_crash_matrix.csv
  <output_dir>/<prefix>_summary.md
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

ROOT="${1:-}"
OUTDIR="${2:-analysis}"
PREFIX="${3:-rxlogger_scan}"

if [[ -z "$ROOT" ]]; then
  usage
  exit 1
fi

if [[ ! -d "$ROOT" ]]; then
  echo "Error: folder not found: $ROOT" >&2
  exit 1
fi

if ! find "$ROOT" -maxdepth 0 -type d >/dev/null 2>&1; then
  echo "Error: cannot access folder (permission denied or restricted): $ROOT" >&2
  echo "Tip: grant VS Code/Terminal Files and Folders access for Downloads in macOS Privacy settings." >&2
  exit 1
fi

mkdir -p "$OUTDIR"

FILES_CSV="$OUTDIR/${PREFIX}_analysis_summary.csv"
OBS_CSV="$OUTDIR/${PREFIX}_observations_summary.csv"
CRASH_CSV="$OUTDIR/${PREFIX}_quodix_crash_matrix.csv"
SUMMARY_MD="$OUTDIR/${PREFIX}_summary.md"

printf 'file,lines,quodix_refs,api_status_lines,non_2xx_status,quodix_transport_errors,roam_markers,fatal_markers,primary_note\n' > "$FILES_CSV"

while IFS= read -r -d '' file_path; do
  lines=$(wc -l < "$file_path" 2>/dev/null | tr -d ' ')
  quodix_refs=$(grep -Ei 'io\.quodix\.pnc|app_process64' "$file_path" 2>/dev/null | wc -l | tr -d ' ')
  api_status_lines=$(grep -Ei 'Completed API call with status' "$file_path" 2>/dev/null | wc -l | tr -d ' ')
  non_2xx_status=$(grep -Eio 'Completed API call with status: [0-9]+' "$file_path" 2>/dev/null | awk '{print $NF}' | awk '$1 !~ /^2[0-9][0-9]$/ {count++} END {print count+0}')
  quodix_transport_errors=$(grep -Ei 'io\.quodix\.pnc|app_process64' "$file_path" 2>/dev/null | grep -Ei 'UnknownHostException|timeout|timed out|ECONN|connection reset|ConnectException|SSLHandshakeException|status[^0-9]{0,5}50[234]\b|HTTP[^0-9]{0,5}50[234]\b' | wc -l | tr -d ' ')
  roam_markers=$(grep -Ei 'roam|roaming|handover|RRC|cell reselection|detach|attach|reconnect|LinkProperties|NetworkCapabilities' "$file_path" 2>/dev/null | wc -l | tr -d ' ')
  fatal_markers=$(grep -Ei 'FATAL EXCEPTION|Fatal signal|SIGSEGV|SIGABRT|ANR in|backtrace' "$file_path" 2>/dev/null | wc -l | tr -d ' ')

  note="other"
  case "$file_path" in
    *Main*.txt) note="primary app+network timeline" ;;
    *Crash*.txt) note="historical AndroidRuntime crashes" ;;
    */tombstone/*) note="native tombstone" ;;
    */anr/*) note="ANR traces" ;;
    *KLog*.txt) note="kernel logs" ;;
    *Radio*.txt) note="radio/modem logs" ;;
    *System*.txt) note="system service/dropbox events" ;;
    *Resource*.csv) note="resource telemetry csv" ;;
    */snapshots/*) note="state snapshot" ;;
    *ramoops*) note="kernel persistent crash logs" ;;
    *RxInfo.txt) note="capture metadata" ;;
  esac

  printf '"%s",%s,%s,%s,%s,%s,%s,%s,"%s"\n' "$file_path" "$lines" "$quodix_refs" "$api_status_lines" "$non_2xx_status" "$quodix_transport_errors" "$roam_markers" "$fatal_markers" "$note" >> "$FILES_CSV"
done < <(find "$ROOT" -type f -print0 | sort -z)

printf 'file,timestamp,process,signal,thread_name,fault_addr,abort_message,build_fingerprint,top_frames_hash,top_frame_1,top_frame_2,top_frame_3\n' > "$CRASH_CSV"

if [[ -d "$ROOT/tombstone" ]]; then
  while IFS= read -r -d '' tomb_file; do
    proc=$(grep -m1 -E '^Cmd line:|^Cmdline:' "$tomb_file" | sed -E 's/^Cmd ?line:[[:space:]]*//')
    if [[ "$proc" != *"io.quodix.pnc"* ]] && ! grep -qi 'io\.quodix\.pnc' "$tomb_file"; then
      continue
    fi

    ts=$(grep -m1 -E '^Timestamp:' "$tomb_file" | sed 's/^Timestamp:[[:space:]]*//')
    sig=$(grep -m1 -E '^signal' "$tomb_file" | sed 's/^signal[[:space:]]*//' | cut -d',' -f1)
    thr=$(grep -m1 -E '^\s*pid:.*tid:' "$tomb_file" | sed -E 's/.*name:[[:space:]]*([^>]+).*/\1/' | sed 's/[[:space:]]*$//')
    fault_addr=$(grep -m1 -E 'fault addr' "$tomb_file" | sed -E 's/.*fault addr ([^[:space:]]+).*/\1/')
    abort_msg=$(grep -m1 -E '^Abort message:' "$tomb_file" | sed 's/^Abort message:[[:space:]]*//')
    build_fp=$(grep -m1 -E '^Build fingerprint:' "$tomb_file" | sed 's/^Build fingerprint:[[:space:]]*//')
    tf1=$(grep -E '^\s*#00\s+pc' "$tomb_file" | head -n1 | sed 's/^\s*//')
    tf2=$(grep -E '^\s*#01\s+pc' "$tomb_file" | head -n1 | sed 's/^\s*//')
    tf3=$(grep -E '^\s*#02\s+pc' "$tomb_file" | head -n1 | sed 's/^\s*//')
    top_hash=$(printf '%s|%s|%s\n' "$tf1" "$tf2" "$tf3" | shasum -a 1 | awk '{print $1}')

    printf '"%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s","%s"\n' \
      "$tomb_file" "$ts" "$proc" "$sig" "$thr" "$fault_addr" "$abort_msg" "$build_fp" "$top_hash" "$tf1" "$tf2" "$tf3" >> "$CRASH_CSV"
  done < <(find "$ROOT/tombstone" -type f -print0 | sort -z)
fi

files_scanned=$(awk 'END{print NR-1}' "$FILES_CSV")
completed_status=$(awk -F, 'NR>1 {sum+=$4} END{print sum+0}' "$FILES_CSV")
non_2xx=$(awk -F, 'NR>1 {sum+=$5} END{print sum+0}' "$FILES_CSV")
q_transport=$(awk -F, 'NR>1 {sum+=$6} END{print sum+0}' "$FILES_CSV")
roam_total=$(awk -F, 'NR>1 {sum+=$7} END{print sum+0}' "$FILES_CSV")
q_tombstones=$(awk 'END{print NR-1}' "$CRASH_CSV")

anr_total=0
anr_quodix=0
if [[ -d "$ROOT/anr" ]]; then
  anr_total=$(find "$ROOT/anr" -type f | wc -l | tr -d ' ')
  anr_quodix=$(find "$ROOT/anr" -type f -print0 | while IFS= read -r -d '' anr_file; do
    grep -qi 'Cmd line: io\.quodix\.pnc' "$anr_file" && echo 1
  done | wc -l | tr -d ' ')
fi

wlan_wait=$(grep -Rci 'wlan_osif_wait_timed_out\|OSIF wait timed out' "$ROOT"/KLog*.txt 2>/dev/null | awk -F: '{sum+=$2} END{print sum+0}')

top_processes="none"
if [[ -f "$ROOT/Crash0.txt" ]]; then
  top_processes=$(grep -E 'FATAL EXCEPTION|Process:' "$ROOT/Crash0.txt" 2>/dev/null | paste - - | sed -E 's/.*Process:[[:space:]]*([^, ]+).*/\1/' | sort | uniq -c | sort -nr | head -n 3 | awk '{printf "%s%s (%s)", sep,$2,$1; sep="; "}')
  top_processes=${top_processes:-none}
fi

printf 'category,scope,metric,value,notes\n' > "$OBS_CSV"
printf 'Scan,All logs,files_scanned,%s,Total files scanned\n' "$files_scanned" >> "$OBS_CSV"
printf 'Quodix API,All files,completed_status_lines,%s,Found via "Completed API call with status"\n' "$completed_status" >> "$OBS_CSV"
printf 'Quodix API,All files,non_2xx_status,%s,No non-2xx outcomes if zero\n' "$non_2xx" >> "$OBS_CSV"
printf 'Quodix API,All files,quodix_transport_errors,%s,Quodix-scoped UnknownHost/timeout/connect/SSL/HTTP-5xx markers\n' "$q_transport" >> "$OBS_CSV"
printf 'Mobility,All files,roam_markers,%s,Roaming/reconnect indicators\n' "$roam_total" >> "$OBS_CSV"
printf 'Native crashes,tombstone,quodix_tombstones,%s,Tombstones tied to io.quodix.pnc\n' "$q_tombstones" >> "$OBS_CSV"
printf 'ANR,anr folder,files_with_quodix_cmdline,%s,out of %s ANR files\n' "$anr_quodix" "$anr_total" >> "$OBS_CSV"
printf 'Kernel WLAN,KLog,wlan_osif_wait_timed_out,%s,Kernel Wi-Fi timeout pattern\n' "$wlan_wait" >> "$OBS_CSV"
printf 'Java crashes,Crash0,top_processes,0,%s\n' "$top_processes" >> "$OBS_CSV"

{
  echo '# RxLogger Scan Summary'
  echo
  echo '## Executive Verdict'
  if [[ "$non_2xx" -eq 0 && "$q_transport" -eq 0 ]]; then
    echo '- Main-log evidence does not support API-failure-driven outages as a direct cause (no non-2xx and no Quodix-scoped transport failures).'
  else
    echo '- Main-log evidence shows potential network/API error contribution; inspect non-2xx and transport marker details.'
  fi
  echo '- Crash evidence should be reviewed as a primary lead when tombstones are present.'
  echo
  echo '## Key Counts'
  echo "- Files scanned: $files_scanned"
  echo "- Quodix API status lines: $completed_status"
  echo "- Non-2xx statuses: $non_2xx"
  echo "- Quodix transport-error markers: $q_transport"
  echo "- Roaming/reconnect markers: $roam_total"
  echo "- Quodix tombstones: $q_tombstones"
  echo "- ANR files mentioning Quodix cmdline: $anr_quodix / $anr_total"
  echo
  echo '## Artifacts'
  echo "- $FILES_CSV"
  echo "- $OBS_CSV"
  echo "- $CRASH_CSV"
} > "$SUMMARY_MD"

echo "Created: $FILES_CSV"
echo "Created: $OBS_CSV"
echo "Created: $CRASH_CSV"
echo "Created: $SUMMARY_MD"
