## Installations Init
```
sudo apt update

sudo apt install -y btop git iw

sudo loginctl enable-linger

sudo tee /etc/systemd/system/wifi-power.service << 'EOF'
[Unit]
Description=Disable WiFi power management
After=network-pre.target
Before=network.target
[Service]
Type=oneshot
ExecStart=/sbin/iw dev wlan0 set power_save off
[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable wifi-power.service

curl -fsSL https://tailscale.com/install.sh | sh

sudo tailscale up

sudo systemctl enable tailscaled

sudo tee /etc/cron.d/tailscale-keepalive << 'EOF'
*/5 * * * * root /usr/bin/tailscale status >/dev/null 2>&1 || /usr/bin/systemctl restart tailscaled
EOF
```

## Wifi
```
sudo nmcli device wifi rescan
nmcli device wifi list
sudo nmcli device wifi connect "SFR_D0C0" password "PASSWORD"
nmcli device status
nmcli connection show
sudo nmcli connection modify "netplan-wlan0-SFR-7FA5" connection.autoconnect-retries 0
sudo nmcli connection modify "SFR_D0C0" connection.autoconnect-retries 0
sudo nmcli connection modify "netplan-wlan0-SFR-7FA5" connection.autoconnect-priority 200
sudo nmcli connection modify "SFR_D0C0" connection.autoconnect-priority 100
```

## Screen
```
grep -q "fbcon=map:10" /boot/firmware/cmdline.txt || sudo sed -i 's/$/ fbcon=map:10/' /boot/firmware/cmdline.txt
sudo rm -rf LCD-show
git clone https://github.com/goodtft/LCD-show.git
chmod -R 755 LCD-show
cd LCD-show/
sudo ./LCD35-show
sudo rm -rf LCD-show

grep -q "dtoverlay=tft35a:rotate=90,speed=32000000,fps=30" /boot/firmware/config.txt || \
sudo sed -i 's/^dtoverlay=tft35a:rotate=90.*/dtoverlay=tft35a:rotate=90,speed=32000000,fps=30/' /boot/firmware/config.txt

grep -q "dtoverlay=disable-bt" /boot/firmware/config.txt || echo "dtoverlay=disable-bt" | sudo tee -a /boot/firmware/config.txt

echo "dtparam=spi=on" | sudo tee -a /boot/firmware/config.txt
```

## Customization
```
sudo apt install -y zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

```
cat > ~/.oh-my-zsh/themes/robbyrussell.zsh-theme << 'EOF'
PROMPT="%{$fg[green]%}%m%{$reset_color%} "
PROMPT+="%(?:%{$fg_bold[green]%}%1{➜%} :%{$fg_bold[red]%}%1{➜%} )"
PROMPT+="%{$fg[cyan]%}%c%{$reset_color%}"
PROMPT+=' $(git_prompt_info)'

ZSH_THEME_GIT_PROMPT_PREFIX="%{$fg_bold[blue]%}git:(%{$fg[red]%}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%{$reset_color%} "
ZSH_THEME_GIT_PROMPT_DIRTY="%{$fg[blue]%}) %{$fg[yellow]%}%1{✗%}"
ZSH_THEME_GIT_PROMPT_CLEAN="%{$fg[blue]%})"
EOF
```

```
cat > ~/welcome.py << 'EOF'
#!/usr/bin/env python3
import subprocess
import os
from datetime import datetime

GREEN = "\033[38;2;144;238;52m"
GREY = "\033[38;2;80;80;80m"
RESET = "\033[0m"
BOLD = "\033[1m"

def get_screen_res():
    try:
        if os.path.exists("/sys/class/graphics/fb0/virtual_size"):
            with open("/sys/class/graphics/fb0/virtual_size", "r") as f:
                return f.read().strip()
        return "N/A"
    except:
        return "N/A"

def get_wifi_info():
    try:
        cmd = r"nmcli -t -f IN-USE,SSID,BARS device wifi list | grep '^\*'"
        output = subprocess.check_output(cmd, shell=True, text=True).strip()
        parts = output.split(':')
        return f"{parts[1]} - {parts[2]}"
    except:
        return "Disconnected"

def display_dashboard():
    now = datetime.now().strftime("%H:%M:%S")
    screen = get_screen_res()
    wifi_str = get_wifi_info()

    logo = [
        "   _____     _           _     ",
        "  |     |___| |_ ___ ___| |_   ",
        "  | | | | . | '_| .'|  _|  _|  ",
        "  |_|_|_|___|_,_|__,|_| |_|    "
    ]

    for line in logo:
        print(f"{GREEN}{BOLD}{line}{RESET}")

    separator = "—————————————————————————————————————————————"
    print(f"{GREY}{separator}{RESET}")
    print(f" {GREEN}SCREEN:{RESET} {screen.ljust(15)} {GREEN}TIME:{RESET} {now}")
    print(f" {GREEN}CONNEXION:{RESET} {wifi_str}")
    print(f"{GREY}{separator}{RESET}")

if __name__ == "__main__":
    display_dashboard()
EOF
```

```
chmod +x ~/welcome.py
echo "python3 ~/welcome.py" >> ~/.zshrc
source ~/.zshrc
```

## Python & Dependencies
```sh
sudo apt install python3-numpy python3-psutil python3-pil
wget https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf
```
