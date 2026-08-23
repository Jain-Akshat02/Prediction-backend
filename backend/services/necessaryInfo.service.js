const necessaryDataExtraction = async (weatherData) => {
  const {
    main: {
      temp,
      humidity,
    } = {},

    wind: {
      speed: windSpeed,
    } = {},

    rain,
    dt,
  } = weatherData;

  return {
    // OpenWeather dt is Unix timestamp (seconds)
    acq_date: new Date(dt * 1000).toISOString(),

    // OpenWeather gives humidity as percentage (84)
    // Model expects fraction (0.84)
    Humidity_Fraction: humidity / 100,

    // OpenWeather metric temperature is already Celsius
    Temperature_C: temp,

    // OpenWeather wind speed is m/s
    // Model expects km/h
    Wind_Speed_kmh: windSpeed * 3.6,

    // Rainfall in mm for the last 1 hour
    // If rain data doesn't exist, use 0
    Rainfall_mm: rain?.['1h'] ?? rain?.['3h'] ?? 0,
  };
};

module.exports = {
  necessaryDataExtraction,
};