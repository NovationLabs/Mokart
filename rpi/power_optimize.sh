#!/bin/bash
# ============================================================
#  RPi Zero 2 W — Power Optimization & Check Script
#  Usage: sudo bash rpi_power_optimize.sh
# ============================================================

# --- Couleurs ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

ok()   { echo -e "${GREEN}  ✔ ${NC}$1"; }
fail() { echo -e "${RED}  ✘ ${NC}$1"; }
info() { echo -e "${BLUE}  → ${NC}$1"; }
warn() { echo -e "${YELLOW}  ⚠ ${NC}$1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; }
sep()  { echo -e "${BOLD}  ══════════════════════════════════════════${NC}"; }

# ============================================================
# Menu flèches
# ============================================================
arrow_menu() {
  local prompt="$1"; shift
  local options=("$@")
  local selected=0
  local key esc

  tput civis
  echo -e "\n  ${BOLD}${prompt}${NC}\n"

  while true; do
    for i in "${!options[@]}"; do
      tput el
      if [ "$i" -eq "$selected" ]; then
        echo -e "  ${CYAN}▶  ${BOLD}${options[$i]}${NC}"
      else
        echo -e "  ${DIM}   ${options[$i]}${NC}"
      fi
    done

    IFS= read -rsn1 key
    if [[ "$key" == $'\x1b' ]]; then
      read -rsn1 -t 0.1 esc
      read -rsn1 -t 0.1 key
      case "${esc}${key}" in
        '[A') ((selected--)); [ "$selected" -lt 0 ] && selected=$(( ${#options[@]} - 1 )) ;;
        '[B') ((selected++)); [ "$selected" -ge "${#options[@]}" ] && selected=0 ;;
      esac
    elif [[ "$key" == "" ]]; then
      break
    fi

    tput cuu "${#options[@]}"
  done

  tput cnorm
  echo ""
  MENU_RESULT=$selected
}

# ============================================================
# Vérifications communes
# ============================================================
check_root() {
  if [ "$EUID" -ne 0 ]; then
    err "Ce script doit être lancé avec sudo."
    exit 1
  fi
}

detect_config() {
  if [ -f /boot/firmware/config.txt ]; then
    CONFIG=/boot/firmware/config.txt
  elif [ -f /boot/config.txt ]; then
    CONFIG=/boot/config.txt
  else
    err "Impossible de trouver config.txt"
    exit 1
  fi
}

# ============================================================
# MODE CHECK
# ============================================================
run_check() {
  sep
  echo -e "\n  ${BOLD}  Vérification des optimisations${NC}\n"
  sep

  local score=0
  local total=0

  check_item() {
    local label="$1"
    local ok_val="$2"
    local current="$3"
    local gain="$4"
    total=$((total + 1))
    if [[ "$current" == "$ok_val" ]]; then
      ok "${label} ${DIM}(${current})${NC}  ${GREEN}+${gain}${NC}"
      score=$((score + 1))
    else
      fail "${label}  ${DIM}attendu: ${ok_val} | actuel: ${current}${NC}  ${YELLOW}~${gain} non appliqué${NC}"
    fi
  }

  echo -e "  ${BOLD}── CPU ──────────────────────────────────${NC}"

  # Governor
  GOV=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 2>/dev/null || echo "inconnu")
  check_item "Governor CPU" "powersave" "$GOV" "150mW"

  # Fréquence max
  FREQ_HZ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq 2>/dev/null || echo "0")
  FREQ_MHZ=$(( FREQ_HZ / 1000 ))
  if [ "$FREQ_MHZ" -le 800 ]; then
    ok "Sous-clocking CPU  ${DIM}(${FREQ_MHZ} MHz ≤ 800)${NC}  ${GREEN}+~50mW${NC}"
    score=$((score + 1))
  else
    fail "Sous-clocking CPU  ${DIM}(${FREQ_MHZ} MHz — non réduit)${NC}  ${YELLOW}~50mW non appliqué${NC}"
  fi
  total=$((total + 1))

  # Temp
  TEMP=$(vcgencmd measure_temp 2>/dev/null | grep -o '[0-9.]*' || echo "?")
  info "Température CPU : ${TEMP}°C"

  echo ""
  echo -e "  ${BOLD}── HDMI ─────────────────────────────────${NC}"
  HDMI_CFG=$(grep "^hdmi_blanking" "$CONFIG" 2>/dev/null | cut -d= -f2 || echo "absent")
  check_item "HDMI désactivé (config)" "2" "$HDMI_CFG" "22mW"

  echo ""
  echo -e "  ${BOLD}── Bluetooth ────────────────────────────${NC}"
  if grep -q "^dtoverlay=disable-bt" "$CONFIG" 2>/dev/null; then
    BT_CFG="présent"
  else
    BT_CFG="absent"
  fi
  check_item "Bluetooth désactivé (config)" "présent" "$BT_CFG" "12mW"

  BT_SVC=$(systemctl is-active bluetooth 2>/dev/null; true)
  BT_SVC=${BT_SVC:-inactive}
  check_item "Service bluetooth" "inactive" "$BT_SVC" ""

  echo ""
  echo -e "  ${BOLD}── GPU ──────────────────────────────────${NC}"
  GPU_MEM=$(vcgencmd get_mem gpu 2>/dev/null | grep -o '[0-9]*' || grep "^gpu_mem=" "$CONFIG" | cut -d= -f2 || echo "?")
  if [ "$GPU_MEM" -le 16 ] 2>/dev/null; then
    ok "GPU memory  ${DIM}(${GPU_MEM}M)${NC}  ${GREEN}+7mW${NC}"
    score=$((score + 1))
  else
    fail "GPU memory  ${DIM}(${GPU_MEM}M — devrait être 16)${NC}"
  fi
  total=$((total + 1))

  echo ""
  echo -e "  ${BOLD}── Services ─────────────────────────────${NC}"
  for svc in avahi-daemon man-db.timer apt-daily.timer apt-daily-upgrade.timer; do
    STATE=$(systemctl is-active "$svc" 2>/dev/null; true)
    STATE=${STATE:-inactive}
    if [[ "$STATE" == "inactive" || "$STATE" == "dead" || "$STATE" == "failed" ]]; then
      ok "Service désactivé : ${svc}"
      score=$((score + 1))
    else
      fail "Service encore actif : ${svc}  ${DIM}(${STATE})${NC}"
    fi
    total=$((total + 1))
  done

  echo ""
  echo -e "  ${BOLD}── WiFi ─────────────────────────────────${NC}"
  WIFI_PS=$(iw dev wlan0 get power_save 2>/dev/null | grep -o 'on\|off' || echo "inconnu")
  info "WiFi Power Save : ${WIFI_PS}  ${DIM}(off = recommandé pour serveur web)${NC}"

  # Score final
  echo ""
  sep
  echo ""
  if [ "$score" -eq "$total" ]; then
    echo -e "  ${GREEN}${BOLD}Toutes les optimisations sont actives ($score/$total)${NC}"
  else
    echo -e "  ${YELLOW}${BOLD}Score : $score / $total optimisations actives${NC}"
  fi
  echo ""

  # ── Mesure consommation sur 10 min ──────────────────────
  sep
  echo -e "\n  ${BOLD}  Mesure de consommation (10 minutes)${NC}"
  echo -e "  ${DIM}Échantillons toutes les 30 secondes via CPU freq + charge${NC}\n"

  SAMPLES=20
  INTERVAL=30
  TOTAL_EST=0
  COUNT=0

  # Lecture CPU usage via /proc/stat
  cpu_usage() {
    local cpu1 cpu2 idle1 idle2 total1 total2
    read -r _ cpu1 < <(grep '^cpu ' /proc/stat)
    local a=($cpu1)
    local idle1=${a[3]}
    local total1=0
    for v in "${a[@]}"; do total1=$((total1 + v)); done

    sleep 1

    read -r _ cpu2 < <(grep '^cpu ' /proc/stat)
    local b=($cpu2)
    local idle2=${b[3]}
    local total2=0
    for v in "${b[@]}"; do total2=$((total2 + v)); done

    local diff_idle=$(( idle2 - idle1 ))
    local diff_total=$(( total2 - total1 ))
    awk "BEGIN {printf \"%.0f\", (1 - $diff_idle / $diff_total) * 100}"
  }

  # Estimation mW : modèle linéaire RPi Zero 2 W
  # Base idle ~220mW, full load 1GHz ~650mW → pente ~4.3 mW/% à 1GHz
  # Ajusté par freq actuelle
  estimate_mw() {
    local freq_mhz="$1"   # fréquence courante
    local load_pct="$2"   # charge CPU %
    local max_freq=1000

    # Base selon fréquence (idle proportionnel)
    local base_mw
    base_mw=$(awk "BEGIN {printf \"%.0f\", 220 * ($freq_mhz / $max_freq) + 80}")

    # Charge dynamique
    local dyn_mw
    dyn_mw=$(awk "BEGIN {printf \"%.0f\", ($load_pct / 100) * 180 * ($freq_mhz / $max_freq)}")

    echo $(( base_mw + dyn_mw ))
  }

  for i in $(seq 1 $SAMPLES); do
    CUR_FREQ_HZ=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq 2>/dev/null || echo 1000000)
    CUR_FREQ=$(( CUR_FREQ_HZ / 1000 ))
    LOAD=$(cpu_usage)
    TEMP=$(vcgencmd measure_temp 2>/dev/null | grep -o '[0-9.]*' || echo "?")
    MW=$(estimate_mw "$CUR_FREQ" "$LOAD")
    TOTAL_EST=$(( TOTAL_EST + MW ))
    COUNT=$(( COUNT + 1 ))

    # Barre de progression (25 chars ASCII pour éviter le wrapping sur 80 cols)
    PROGRESS=$(( i * 25 / SAMPLES ))
    BAR=$(printf '#%.0s' $(seq 1 $PROGRESS))
    EMPTY=$(printf '.%.0s' $(seq 1 $(( 25 - PROGRESS ))))
    PCT=$(( i * 100 / SAMPLES ))

    printf "\r\033[2K  \033[36m[%-25s]\033[0m %3d%%  %4dMHz  %2d%%cpu  %s°C  ~%dmW   " \
      "${BAR}${EMPTY}" "$PCT" "$CUR_FREQ" "$LOAD" "$TEMP" "$MW"

    # Attendre l'intervalle (on a déjà dormi 1s dans cpu_usage)
    sleep $(( INTERVAL - 1 ))
  done

  echo ""
  echo ""

  AVG_MW=$(( TOTAL_EST / COUNT ))
  AUTONOMIE=$(awk "BEGIN {printf \"%.1f\", 3774 / $AVG_MW}")
  AUTONOMIE_OPT=$(awk "BEGIN {printf \"%.1f\", 3774 / 330}")  # référence non-optimisé

  sep
  echo ""
  echo -e "  ${BOLD}Consommation moyenne mesurée : ${GREEN}~${AVG_MW} mW${NC}"
  echo -e "  Autonomie PiSugar 1200mAh   : ${GREEN}~${AUTONOMIE}h${NC}"
  echo -e "  ${DIM}(référence non-optimisé      : ~6.2h à ~610mW)${NC}"
  echo ""
  sep
  echo ""
}

# ============================================================
# MODE OPTIMISATION
# ============================================================
run_optimize() {
  detect_config
  info "Fichier config détecté : $CONFIG"

  BACKUP="${CONFIG}.bak.$(date +%Y%m%d_%H%M%S)"
  cp "$CONFIG" "$BACKUP"
  ok "Backup créé : $BACKUP"

  sep
  echo -e "\n  ${BOLD}  RPi Zero 2 W — Optimisation consommation${NC}\n"
  sep

  # 1. Governor CPU
  echo ""
  info "1. Governor CPU → powersave"

  cat > /etc/systemd/system/cpufreq-powersave.service << 'EOF'
[Unit]
Description=Set CPU governor to powersave
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo powersave | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable --now cpufreq-powersave.service
  echo powersave | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor > /dev/null
  ok "Governor CPU → powersave (immédiat + persistant)  ${GREEN}~150mW${NC}"

  # 2. HDMI
  echo ""
  info "2. Désactivation HDMI"
  if command -v tvservice &>/dev/null; then
    tvservice -o 2>/dev/null && ok "HDMI éteint immédiatement" || warn "tvservice a échoué (ignoré)"
  fi
  if ! grep -q "hdmi_blanking" "$CONFIG"; then
    printf "\n# Disable HDMI output\nhdmi_blanking=2\n" >> "$CONFIG"
    ok "hdmi_blanking=2 ajouté  ${GREEN}~22mW${NC}"
  else
    sed -i 's/^hdmi_blanking=.*/hdmi_blanking=2/' "$CONFIG"
    ok "hdmi_blanking=2 mis à jour"
  fi

  # 3. Bluetooth
  echo ""
  info "3. Désactivation Bluetooth"
  if ! grep -q "dtoverlay=disable-bt" "$CONFIG"; then
    printf "\n# Disable Bluetooth\ndtoverlay=disable-bt\n" >> "$CONFIG"
    ok "dtoverlay=disable-bt ajouté  ${GREEN}~12mW${NC}"
  else
    ok "dtoverlay=disable-bt déjà présent"
  fi
  systemctl disable --now bluetooth 2>/dev/null && ok "Service bluetooth désactivé" || warn "Service bluetooth introuvable (ignoré)"
  systemctl disable --now hciuart   2>/dev/null && ok "Service hciuart désactivé"   || warn "Service hciuart introuvable (ignoré)"

  # 4. GPU memory
  echo ""
  info "4. Mémoire GPU réduite à 16 Mo"
  if ! grep -q "^gpu_mem=" "$CONFIG"; then
    printf "\n# Minimum GPU memory (headless)\ngpu_mem=16\n" >> "$CONFIG"
    ok "gpu_mem=16 ajouté  ${GREEN}~7mW${NC}"
  else
    sed -i 's/^gpu_mem=.*/gpu_mem=16/' "$CONFIG"
    ok "gpu_mem mis à jour → 16"
  fi

  # 5. Services
  echo ""
  info "5. Désactivation des services inutiles"
  for svc in avahi-daemon triggerhappy dphys-swapfile man-db.timer apt-daily.timer apt-daily-upgrade.timer; do
    if systemctl list-unit-files --full --all | grep -q "^${svc}"; then
      systemctl disable --now "$svc" 2>/dev/null && ok "Désactivé : $svc" || warn "Impossible : $svc"
    else
      warn "Introuvable (ignoré) : $svc"
    fi
  done
  echo -e "  ${GREEN}→ Gain collectif : ~30mW${NC}"

  # 6. WiFi Power Save
  echo ""
  sep
  arrow_menu "WiFi Power Save — trade-off latence / autonomie" \
    "Non  — meilleure latence (recommandé pour serveur web)" \
    "Oui  — économise ~45mW, ajoute ~100-300ms de latence"

  wifi_ps=$MENU_RESULT

  if [ "$wifi_ps" -eq 1 ]; then
    iw dev wlan0 set power_save on 2>/dev/null && ok "WiFi Power Save activé  ${GREEN}~45mW${NC}" || warn "iw non disponible, ignoré"
    RC=/etc/rc.local
    [ ! -f "$RC" ] && { echo '#!/bin/bash' > "$RC"; chmod +x "$RC"; }
    if ! grep -q "power_save on" "$RC"; then
      grep -q "^exit 0" "$RC" \
        && sed -i '/^exit 0/i iw dev wlan0 set power_save on' "$RC" \
        || echo "iw dev wlan0 set power_save on" >> "$RC"
      ok "WiFi Power Save persistant ajouté dans $RC"
    fi
  else
    iw dev wlan0 set power_save off 2>/dev/null && ok "WiFi Power Save désactivé (latence optimale)" || true
  fi

  # 7. Sous-clocking
  echo ""
  sep
  arrow_menu "Sous-clocking CPU — réduit la fréquence max" \
    "800 MHz — léger, recommandé  (~50mW)" \
    "600 MHz — agressif, surveille les perfs Docker  (~80mW)" \
    "Ignorer"

  clock_choice=$MENU_RESULT

  case "$clock_choice" in
    0) FREQ=800 ;;
    1) FREQ=600 ;;
    *) FREQ="" ; info "Sous-clocking ignoré" ;;
  esac

  if [ -n "$FREQ" ]; then
    if grep -q "^arm_freq=" "$CONFIG"; then
      sed -i "s/^arm_freq=.*/arm_freq=${FREQ}/" "$CONFIG"
    else
      printf "\n# CPU underclocking\narm_freq=%s\n" "$FREQ" >> "$CONFIG"
    fi
    ok "arm_freq=${FREQ} MHz défini  ${GREEN}~50mW${NC}"
  fi

  # Résumé
  echo ""
  sep
  echo -e "\n  ${BOLD}  Résumé${NC}\n"

  TOTAL_LOW=220
  TOTAL_HIGH=270
  [ "$wifi_ps" -eq 1 ] 2>/dev/null && TOTAL_LOW=$((TOTAL_LOW+45)) && TOTAL_HIGH=$((TOTAL_HIGH+45))
  [ -n "$FREQ" ] && TOTAL_LOW=$((TOTAL_LOW+30)) && TOTAL_HIGH=$((TOTAL_HIGH+80))

  CONSO_LOW=$(( 610 - TOTAL_HIGH ))
  CONSO_HIGH=$(( 610 - TOTAL_LOW ))
  AUTONOMIE_MAX=$(awk "BEGIN {printf \"%.1f\", 3774 / $CONSO_LOW}")
  AUTONOMIE_MIN=$(awk "BEGIN {printf \"%.1f\", 3774 / $CONSO_HIGH}")

  echo -e "  Consommation avant  : ${BOLD}~610 mW${NC}  (~6.2h)"
  echo -e "  Gain estimé         : ${GREEN}~${TOTAL_LOW}–${TOTAL_HIGH} mW${NC}"
  echo -e "  Consommation après  : ${GREEN}~${CONSO_LOW}–${CONSO_HIGH} mW${NC}"
  echo -e "  Autonomie estimée   : ${GREEN}~${AUTONOMIE_MIN}h – ${AUTONOMIE_MAX}h${NC}"
  echo ""
  sep
  echo ""
  warn "Un redémarrage est nécessaire pour appliquer les changements config.txt"
  echo ""

  arrow_menu "Redémarrer maintenant ?" "Oui — redémarrer" "Non — je le ferai plus tard"

  if [ "$MENU_RESULT" -eq 0 ]; then
    ok "Redémarrage dans 3 secondes..."
    sleep 3
    reboot
  else
    info "Lance : sudo reboot"
  fi
}

# ============================================================
# ENTRÉE PRINCIPALE
# ============================================================
check_root

clear
echo ""
sep
echo -e "\n  ${BOLD}  RPi Zero 2 W — Power Manager${NC}\n"
sep

arrow_menu "Que veux-tu faire ?" \
  "Optimiser   — appliquer toutes les optimisations de consommation" \
  "Vérifier    — checker les réglages + mesure conso sur 10 minutes"

case "$MENU_RESULT" in
  0) run_optimize ;;
  1) detect_config; run_check ;;
esac
