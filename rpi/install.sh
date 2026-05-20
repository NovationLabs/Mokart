#!/bin/bash
set -e

# ── Colors (MoKart green #90EE34) ─────────────────────────────────────────────
G="\033[38;2;144;238;52m"      # mokart green
GD="\033[38;2;80;110;30m"      # green dark
GR="\033[38;2;60;60;60m"       # grey
W="\033[0;37m"                 # white
R="\033[0;31m"                 # red
B="\033[1m"                    # bold
RS="\033[0m"                   # reset

# ── Progress bar ──────────────────────────────────────────────────────────────
STEP=0
TOTAL=10
BAR_WIDTH=42

draw_bar() {
    local label="$1"
    local filled=$(( STEP * BAR_WIDTH / TOTAL ))
    local empty=$(( BAR_WIDTH - filled ))
    local pct=$(( STEP * 100 / TOTAL ))
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="▰"; done
    for ((i=0; i<empty; i++)); do bar+="▱"; done
    echo -e "\n${GR}  ──────────────────────────────────────────────────${RS}"
    echo -e "  ${G}${B}▸ ${label}${RS}"
    echo -e "${GR}  ──────────────────────────────────────────────────${RS}"
    echo -e "  ${G}${bar}${RS} ${B}${pct}%${RS}\n"
}

skip() {
    echo -e "  ${GD}✓  $1${RS}  ${GR}(déjà installé)${RS}"
}

done_step() {
    STEP=$((STEP + 1))
    local filled=$(( STEP * BAR_WIDTH / TOTAL ))
    local empty=$(( BAR_WIDTH - filled ))
    local pct=$(( STEP * 100 / TOTAL ))
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="▰"; done
    for ((i=0; i<empty; i++)); do bar+="▱"; done
    echo -e "  ${G}${bar}${RS} ${B}${pct}%${RS}"
}

# ── Header ────────────────────────────────────────────────────────────────────
clear
echo -e "${G}${B}"
echo "   ╔═══════════════════════════════════════════╗"
echo "   ║   _____     _           _                 ║"
echo "   ║  |     |___| |_ ___ ___| |_               ║"
echo "   ║  | | | | . | '_| .'|  _|  _|              ║"
echo "   ║  |_|_|_|___|_,_|__,|_| |_|                ║"
echo "   ║                                           ║"
echo "   ║         RPi Installer  v0.1               ║"
echo "   ╚═══════════════════════════════════════════╝"
echo -e "${RS}"
sleep 0.5

# ─── 1. Packages de base ──────────────────────────────────────────────────────
if ! command -v btop &>/dev/null || ! command -v git &>/dev/null; then
    draw_bar "Packages de base  (btop, git)"
    sudo apt update -qq
    sudo apt install -y btop git
else
    skip "btop & git"
fi
sudo loginctl enable-linger 2>/dev/null || true
done_step

# ─── 2. Zsh ───────────────────────────────────────────────────────────────────
if ! command -v zsh &>/dev/null; then
    draw_bar "Zsh"
    sudo apt install -y zsh
else
    skip "zsh"
fi
done_step

# ─── 3. Oh My Zsh ─────────────────────────────────────────────────────────────
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    draw_bar "Oh My Zsh"
    RUNZSH=no CHSH=no sh -c \
        "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
else
    skip "oh-my-zsh"
fi
done_step

# ─── 4. Thème Zsh (MoKart) ────────────────────────────────────────────────────
draw_bar "Thème Zsh MoKart"
cat > "$HOME/.oh-my-zsh/themes/robbyrussell.zsh-theme" << 'THEME'
PROMPT="%{$fg[green]%}%m%{$reset_color%} "
PROMPT+="%(?:%{$fg_bold[green]%}%1{➜%} :%{$fg_bold[red]%}%1{➜%} )"
PROMPT+="%{$fg[cyan]%}%c%{$reset_color%}"
PROMPT+=' $(git_prompt_info)'
ZSH_THEME_GIT_PROMPT_PREFIX="%{$fg_bold[blue]%}git:(%{$fg[red]%}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%{$reset_color%} "
ZSH_THEME_GIT_PROMPT_DIRTY="%{$fg[blue]%}) %{$fg[yellow]%}%1{✗%}"
ZSH_THEME_GIT_PROMPT_CLEAN="%{$fg[blue]%})"
THEME
grep -q "welcome.py" "$HOME/.zshrc" || echo "python3 ~/welcome.py" >> "$HOME/.zshrc"
done_step

# ─── 5. welcome.py ────────────────────────────────────────────────────────────
if [ ! -f "$HOME/welcome.py" ]; then
    draw_bar "welcome.py (dashboard SSH)"
    cat > "$HOME/welcome.py" << 'WELCOME'
#!/usr/bin/env python3
import subprocess, os
from datetime import datetime

GREEN = "\033[38;2;144;238;52m"
GREY  = "\033[38;2;80;80;80m"
RESET = "\033[0m"
BOLD  = "\033[1m"

def get_screen_res():
    try:
        path = "/sys/class/graphics/fb0/virtual_size"
        return open(path).read().strip() if os.path.exists(path) else "N/A"
    except: return "N/A"

def get_wifi_info():
    try:
        out = subprocess.check_output(
            r"nmcli -t -f IN-USE,SSID,BARS device wifi list | grep '^\*'",
            shell=True, text=True).strip()
        p = out.split(':')
        return f"{p[1]} - {p[2]}"
    except: return "Disconnected"

logo = [
    "   _____     _           _     ",
    "  |     |___| |_ ___ ___| |_   ",
    "  | | | | . | '_| .'|  _|  _|  ",
    "  |_|_|_|___|_,_|__,|_| |_|    "
]
for l in logo: print(f"{GREEN}{BOLD}{l}{RESET}")
sep = "—" * 45
print(f"{GREY}{sep}{RESET}")
print(f" {GREEN}SCREEN:{RESET} {get_screen_res().ljust(15)} {GREEN}TIME:{RESET} {datetime.now().strftime('%H:%M:%S')}")
print(f" {GREEN}CONNEXION:{RESET} {get_wifi_info()}")
print(f"{GREY}{sep}{RESET}")
WELCOME
    chmod +x "$HOME/welcome.py"
else
    skip "welcome.py"
fi
done_step

# ─── 6. Python & dépendances ──────────────────────────────────────────────────
PY_MISSING=false
for pkg in numpy psutil PIL serial matplotlib; do
    python3 -c "import $pkg" 2>/dev/null || { PY_MISSING=true; break; }
done

if $PY_MISSING; then
    draw_bar "Python — numpy, psutil, Pillow, pyserial, matplotlib"
    sudo apt install -y python3-numpy python3-psutil python3-pil python3-serial python3-matplotlib
else
    skip "dépendances Python"
fi
done_step

# ─── 7. Police Roboto ─────────────────────────────────────────────────────────
if [ ! -f "$HOME/Roboto-Bold.ttf" ]; then
    draw_bar "Police Roboto-Bold"
    wget -q "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf" \
         -O "$HOME/Roboto-Bold.ttf"
else
    skip "Roboto-Bold.ttf"
fi
done_step

# ─── 8. Base de données SQLite ────────────────────────────────────────────────
if [ ! -f "$HOME/mokart.db" ]; then
    draw_bar "Base de données SQLite (mokart.db)"
    curl -fsSL https://raw.githubusercontent.com/NovationLabs/Mokart/rpi-curl-installer/rpi/create_db.py \
        -o "$HOME/create_db.py"
    python3 "$HOME/create_db.py"
else
    skip "mokart.db"
fi
done_step

# ─── 9. Tailscale ─────────────────────────────────────────────────────────────
if ! command -v tailscale &>/dev/null; then
    draw_bar "Tailscale (VPN)"
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo systemctl enable tailscaled
else
    skip "tailscale"
fi
done_step

# ─── 10. Écran LCD 3.5" ───────────────────────────────────────────────────────
LCD_CONFIGURED=false
grep -q "fbcon=map:10" /boot/firmware/cmdline.txt 2>/dev/null && LCD_CONFIGURED=true

if ! $LCD_CONFIGURED; then
    draw_bar "Écran LCD 3.5\" (SPI)"
    echo -e "  ${R}⚠  Cette étape va REBOOTER le Pi automatiquement.${RS}"
    read -rp "  Continuer ? (o/N) : " confirm
    if [[ "$confirm" =~ ^[Oo]$ ]]; then
        grep -q "fbcon=map:10" /boot/firmware/cmdline.txt || \
            sudo sed -i 's/$/ fbcon=map:10/' /boot/firmware/cmdline.txt
        grep -q "dtoverlay=disable-bt" /boot/firmware/config.txt || \
            echo "dtoverlay=disable-bt" | sudo tee -a /boot/firmware/config.txt
        grep -q "dtparam=spi=on" /boot/firmware/config.txt || \
            echo "dtparam=spi=on" | sudo tee -a /boot/firmware/config.txt
        grep -q "dtoverlay=tft35a:rotate=90,speed=32000000,fps=30" /boot/firmware/config.txt || \
            echo "dtoverlay=tft35a:rotate=90,speed=32000000,fps=30" | sudo tee -a /boot/firmware/config.txt
        sudo rm -rf ~/LCD-show
        git clone https://github.com/goodtft/LCD-show.git ~/LCD-show
        chmod -R 755 ~/LCD-show
        done_step
        echo -e "\n  ${G}${B}Reboot dans 3s...${RS}"
        sleep 3
        sudo ~/LCD-show/LCD35-show
    else
        echo -e "  ${GR}Écran ignoré.${RS}"
        done_step
    fi
else
    skip "LCD 3.5\""
    done_step
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo -e "\n${G}${B}"
echo "   ╔═══════════════════════════════════════════╗"
echo "   ║   ✓  MoKart RPi prêt.                     ║"
echo "   ╚═══════════════════════════════════════════╝"
echo -e "${RS}"
echo -e "  ${W}Prochaines étapes :${RS}"
echo -e "  ${G}▸${RS} sudo tailscale up       ${GR}# auth Tailscale${RS}"
echo -e "  ${G}▸${RS} source ~/.zshrc          ${GR}# activer zsh${RS}"
echo ""
