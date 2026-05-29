import asyncio
from datetime import datetime

from bleak import BleakScanner, BleakClient

HR_SERVICE_UUID     = "0000180d-0000-1000-8000-00805f9b34fb"
HR_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

BATTERY_UUID      = "00002a19-0000-1000-8000-00805f9b34fb"
MANUFACTURER_UUID = "00002a29-0000-1000-8000-00805f9b34fb"
FIRMWARE_UUID     = "00002a28-0000-1000-8000-00805f9b34fb"
HARDWARE_UUID     = "00002a27-0000-1000-8000-00805f9b34fb"


async def safe_read(client, uuid, decode=True):
    try:
        value = await client.read_gatt_char(uuid)

        if decode:
            return value.decode(errors="ignore").strip()

        return value[0]

    except Exception:
        return "N/A"


def parse_hr(data: bytearray) -> int:
    flags = data[0]

    if flags & 0x01:
        return int.from_bytes(data[1:3], "little")

    return data[1]


def on_hr(sender, data):
    bpm = parse_hr(data)
    now = datetime.now().strftime("%H:%M:%S")
    print(f"[{now}] - {bpm} BPM")


async def find_first_hr_device():
    print("BLE scan...")

    devices = await BleakScanner.discover(
        timeout=10,
        return_adv=True
    )

    hr_devices = []

    for _, (device, adv) in devices.items():
        services = adv.service_uuids or []

        if any(
            service.lower() == HR_SERVICE_UUID.lower()
            for service in services
        ):
            hr_devices.append({
                "device": device,
                "rssi": adv.rssi
            })

    if not hr_devices:
        print("\nNo heart rate sensor found.")
        return None

    hr_devices.sort(
        key=lambda x: x["rssi"],
        reverse=True
    )

    print("\nHeart rate sensors detected:")

    for i, item in enumerate(hr_devices):
        device = item["device"]
        rssi = item["rssi"]

        print(
            f"[{i}] {rssi} dBm "
            f"{device.name or 'Unknown'} "
            f"({device.address})"
        )

    return hr_devices[0]["device"]


async def main():
    device = await find_first_hr_device()

    if not device:
        return

    print(
        f"\nAuto-connecting to: "
        f"{device.name or 'Unknown'}"
    )

    async with BleakClient(device.address) as client:
        print("Connected.\n")

        manufacturer = await safe_read(client, MANUFACTURER_UUID)
        firmware     = await safe_read(client, FIRMWARE_UUID)
        hardware     = await safe_read(client, HARDWARE_UUID)
        battery      = await safe_read(client, BATTERY_UUID, decode=False)

        print("=== Device information ===")
        print(f"Manufacturer : {manufacturer}")
        print(f"Hardware     : {hardware}")
        print(f"Firmware     : {firmware}")
        print(f"Battery      : {battery}%")
        print("==========================\n")

        await client.start_notify(
            HR_MEASUREMENT_UUID,
            on_hr
        )

        print("Streaming heart rate...")
        print("Ctrl+C to stop.\n")

        try:
            while True:
                await asyncio.sleep(1)

        finally:
            try:
                await client.stop_notify(HR_MEASUREMENT_UUID)
            except Exception:
                pass

            print("\nDisconnected.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print()
