import csv
import random

def generate_mock_imu_data(sampling_rate: int, duration: int, output_file: str):
    samples = sampling_rate * duration
    with open(output_file, "w", newline="") as f:
        writer = csv.writer(f)
        
        # header
        writer.writerow([
        "timestamp","ax","ay","az",
        "gx","gy","gz",
        "roll","pitch","yaw",
        "mx","my","mz",
        "temperature"
    ])
    
    for i in range(samples):
        t = i / sampling_rate
        
        row = [
            round(t, 2),
            round(random.uniform(-0.1, 0.1), 3),   # ax
            round(random.uniform(-0.1, 0.1), 3),   # ay
            round(random.uniform(0.95, 1.05), 3),  # az (gravité)
            
            round(random.uniform(-5, 5), 2),       # gx
            round(random.uniform(-5, 5), 2),       # gy
            round(random.uniform(-5, 5), 2),       # gz
            
            round(random.uniform(-10, 10), 2),     # roll
            round(random.uniform(-10, 10), 2),     # pitch
            round(random.uniform(0, 360), 2),      # yaw
            
            round(random.uniform(-50, 50), 2),     # mx
            round(random.uniform(-50, 50), 2),     # my
            round(random.uniform(-50, 50), 2),     # mz
            
            round(random.uniform(20, 30), 2)       # température
        ]
        
        writer.writerow(row)