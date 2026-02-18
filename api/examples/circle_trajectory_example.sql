-- Trajectoire circulaire complète
insert into sensor_data (
  session_id, timestamp,
  uwb_x, uwb_y, uwb_z,
  imu_ax, imu_ay, imu_az,
  imu_gx, imu_gy, imu_gz,
  steering_angle
)
select
  'd2040cf2-a982-4b6c-a1b9-290a968d552b' as session_id,
  (step * 10000) as timestamp,

  -- UWB position (cercle complet de 20m de rayon + bruit 2cm)
  20 * cos(2 * pi() * step / 100) + (random()*0.04 - 0.02) as uwb_x,
  20 * sin(2 * pi() * step / 100) + (random()*0.04 - 0.02) as uwb_y,
  (random()*0.02 - 0.01) as uwb_z,

  -- IMU accel (accélération centripète + gravité)
  0 + (random()*0.1 - 0.05) as imu_ax,
  1.25 + (random()*0.1 - 0.05) as imu_ay,
  9.81 + (random()*0.1 - 0.05) as imu_az,

  -- IMU gyro (vitesse angulaire constante)
  0 + (random()*0.01 - 0.005) as imu_gx,
  0 + (random()*0.01 - 0.005) as imu_gy,
  0.25 + (random()*0.01 - 0.005) as imu_gz,

  -- angle volant (constant pour un cercle)
  14.0 as steering_angle

from generate_series(1,100) as step;
