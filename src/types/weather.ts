export interface WeatherData {
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
    pressure: number;    // Hava basıncı
    temp_min: number;    // Minimum sıcaklık
    temp_max: number;    // Maksimum sıcaklık
  };
  weather: [{
    main: string;
    description: string;
    icon: string;
  }];
  name: string;
  sys: {
    sunrise: number;     // Gün doğumu (unix timestamp)
    sunset: number;      // Gün batımı (unix timestamp)
    country: string;     // Ülke kodu
  };
  visibility: number;    // Görüş mesafesi (metre)
  wind: {
    speed: number;       // Rüzgar hızı (m/s)
    deg: number;        // Rüzgar yönü (derece)
    gust?: number;      // Rüzgar hamlesi (m/s)
  };
  coord?: {
    lat: number;
    lon: number;
  };
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface ForecastData {
  list: Array<{
    dt: number;           // Tahmin zamanı
    main: {
      temp: number;
      temp_min: number;   // Minimum sıcaklık
      temp_max: number;   // Maksimum sıcaklık
      humidity: number;   // Nem
      feels_like: number;
    };
    weather: [{
      main: string;
      description: string;
      icon: string;
    }];
    clouds: { all: number };
    wind: {
      speed: number;
      deg: number;
    };
    dt_txt: string;      // Tarih ve saat
  }>;
  city: {
    name: string;
    country: string;
  };
}

export interface AirPollutionData {
  list: Array<{
    main: {
      aqi: number;      // Hava kalitesi indeksi (1-5)
    };
    components: {
      co: number;       // Karbon monoksit
      no2: number;      // Azot dioksit
      o3: number;       // Ozon
      pm2_5: number;    // Partikül madde
      pm10: number;     // Partikül madde
    };
  }>;
} 