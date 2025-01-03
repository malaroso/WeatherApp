import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getWeatherByCoords, getWeatherByCity, get5DayForecast, getAirPollution, getUVIndex } from '../services/weatherApi';
import { WeatherData, LocationData, ForecastData, AirPollutionData } from '../types/weather';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

// Hava durumu tipine göre arkaplan renkleri
const weatherGradients: Record<string, readonly [string, string]> = {
  Clear: ['#FF7B54', '#FFA954'],
  Clouds: ['#54A6FF', '#82C0FF'],
  Rain: ['#4B6CB7', '#182848'],
  Snow: ['#E6DADA', '#274046'],
  Thunderstorm: ['#283E51', '#4B79A1'],
  Drizzle: ['#89F7FE', '#66A6FF'],
  Mist: ['#757F9A', '#D7DDE8'],
  default: ['#FF7B54', '#FF7B54'],
} as const;

// Hava durumu tipine göre ikonlar
const weatherIcons = {
  Clear: 'sunny-outline',
  Clouds: 'cloudy-outline',
  Rain: 'rainy-outline',
  Snow: 'snow-outline',
  Thunderstorm: 'thunderstorm-outline',
  Drizzle: 'rainy-outline',
  Mist: 'cloud-outline',
  default: 'partly-sunny-outline',
} as const;

export const HomeScreen: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [airPollution, setAirPollution] = useState<AirPollutionData | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [uvIndex, setUVIndex] = useState<{ value: number } | null>(null);

  // Türkiye'nin büyük şehirleri
  const cities = [
    'Istanbul',
    'Ankara',
    'Izmir',
    'Bursa',
    'Antalya',
    'Adana',
    'Konya',
    'Gaziantep',
    'Eskisehir',
    'Mersin',
  ];

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Konum izni reddedildi');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        console.log('Konum alındı:', location.coords);

        try {
          const [weatherData, forecastData, pollutionData, uvData] = await Promise.all([
            getWeatherByCoords(
              location.coords.latitude,
              location.coords.longitude
            ),
            get5DayForecast(
              location.coords.latitude,
              location.coords.longitude
            ),
            getAirPollution(
              location.coords.latitude,
              location.coords.longitude
            ),
            getUVIndex(
              location.coords.latitude,
              location.coords.longitude
            )
          ]);
          
          setWeather(weatherData);
          setForecast(forecastData);
          setAirPollution(pollutionData);
          setUVIndex(uvData);
        } catch (error) {
          console.error(error);
          setError('Veriler alınamadı');
        }
      } catch (err: any) {
        console.error('Genel hata:', err);
        setError('Konum alınamadı: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, []);



  // Mevcut hava durumuna göre gradient renkleri ve ikonu seç
  const currentWeatherType = weather?.weather[0].main || 'default';
  const gradientColors = weatherGradients[currentWeatherType as keyof typeof weatherGradients] || weatherGradients.default;
  const weatherIcon = weatherIcons[currentWeatherType as keyof typeof weatherIcons] || weatherIcons.default;

  // Loader animasyonu için fonksiyon
  const showLoader = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideLoader = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const onSelectCity = async (index: number, value: string) => {
    try {
      setLoading(true);
      showLoader();
      const startTime = Date.now();
      
      const weatherData = await getWeatherByCity(value);
      const { lat, lon } = weatherData.coord;
      
      const [forecastData, pollutionData, uvData] = await Promise.all([
        get5DayForecast(lat, lon),
        getAirPollution(lat, lon),
        getUVIndex(lat, lon)
      ]);

      // Minimum yükleme süresi kontrolü
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const MIN_LOADING_TIME = 1500;

      if (elapsedTime < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsedTime));
      }
      
      setWeather(weatherData);
      setForecast(forecastData);
      setAirPollution(pollutionData);
      setUVIndex(uvData);
    } catch (err) {
      setError('Şehir bilgileri alınamadı');
    } finally {
      setLoading(false);
      hideLoader();
      setIsModalVisible(false);
    }
  };

  // Nefes alma animasyonu
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulse).start();
  }, []);

  // İlk yükleme ekranı
  if (loading && !weather) {
    return (
      <LinearGradient
        colors={['#4B9FEA', '#85C6FE']}
        style={styles.splashContainer}
      >
        <View style={styles.splashContent}>
          <Animated.View style={[
            styles.splashIconContainer,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <Ionicons 
              name="partly-sunny" 
              size={100} 
              color="white"
            />
          </Animated.View>
          <Text style={styles.splashText}>
            Hava Durumu
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient
        colors={gradientColors}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: gradientColors[0] }]}>
          <Text style={styles.headerTitle}>
            Weather Forecast, {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' })}
          </Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Modern Location Selector */}
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => setIsModalVisible(true)}
        >
          <View style={styles.locationContent}>
            <Ionicons name="location-sharp" size={24} color="white" />
            <Text style={styles.locationButtonText}>
              {weather?.name || 'Select Location'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="white" />
          </View>
        </TouchableOpacity>

        {/* City Selection Modal */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select City</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setIsModalVisible(false)}
                    >
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search city..."
                      placeholderTextColor="#666"
                    />
                  </View>
                  <ScrollView style={styles.cityList}>
                    {cities.map((city, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.cityItem}
                        onPress={() => {
                          onSelectCity(index, city);
                          setIsModalVisible(false);
                        }}
                      >
                        <View style={styles.cityItemContent}>
                          <Ionicons 
                            name="location-outline" 
                            size={20} 
                            color="#666"
                            style={styles.cityIcon}
                          />
                          <View>
                            <Text style={styles.cityName}>{city}</Text>
                            <Text style={styles.countryName}>Turkey</Text>
                          </View>
                        </View>
                        {weather?.name === city && (
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Loader Overlay */}
        {loading && (
          <Animated.View 
            style={[
              styles.loaderOverlay,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <View style={styles.loaderContainer}>
              <View style={styles.loaderIconContainer}>
                <Ionicons name="partly-sunny" size={40} color="#007AFF" />
              </View>
              <Text style={styles.loaderText}>Hava durumu yükleniyor...</Text>
            </View>
          </Animated.View>
        )}

        {/* ScrollView ile kaydırılabilir içerik */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Temperature with Weather Icon */}
          <View style={styles.mainTemp}>
            <Ionicons 
              name={weatherIcon as any} 
              size={80} 
              color="white" 
              style={styles.weatherIcon}
            />
            <Text style={styles.tempText}>{Math.round(weather?.main.temp || 0)}°C</Text>
            <Text style={styles.locationText}>
              {weather?.name}, {weather?.weather[0].description}
            </Text>
            <Text style={styles.timeText}>
              7:35 8:22 →
            </Text>
          </View>

          {/* Forecast Card */}
          <View style={styles.forecastCard}>
            <TouchableOpacity style={styles.forecastHeader}>
              <View style={styles.forecastTitle}>
                <Ionicons name="calendar-outline" size={20} color="#1F1F1F" />
                <Text style={styles.forecastTitleText}>5-Day Forecast</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1F1F1F" />
            </TouchableOpacity>
            
            <Text style={styles.forecastSubtitle}>
              Get a snapshot of upcoming weather conditions, including temperature highs and lows, precipitation chances, and wind speeds.
            </Text>

            {/* Daily Forecast List */}
            {forecast?.list
              .filter((item, index) => index % 8 === 0)
              .slice(0, 5)
              .map((item, index) => {
                // Minimum ve maksimum sıcaklıkları hesapla
                const date = new Date(item.dt * 1000);
                const weatherType = item.weather[0].main;
                const icon = weatherIcons[weatherType as keyof typeof weatherIcons] || weatherIcons.default;

                return (
                  <View key={index} style={styles.dailyItem}>
                    <Text style={styles.dayText}>
                      {index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Ionicons 
                      name={icon as any}
                      size={20} 
                      color="#1F1F1F"
                    />
                    <Text style={styles.humidityText}>{item.main.humidity}%</Text>
                    <View style={styles.tempRange}>
                      <Text style={styles.highTemp}>↑ {Math.round(item.main.temp_max)}°</Text>
                      <View style={styles.tempLine} />
                      <Text style={styles.lowTemp}>↓ {Math.round(item.main.temp_min)}°</Text>
                    </View>
                  </View>
                );
              })}
          </View>

          {/* Precipitation Section */}
          <View style={styles.forecastCard}>
            <TouchableOpacity style={styles.forecastHeader}>
              <View style={styles.forecastTitle}>
                <Text style={styles.forecastTitleText}>Precipitation</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#1F1F1F" />
            </TouchableOpacity>
            <Text style={styles.locationSubtext}>Weather for {weather?.name}</Text>
            <Text style={styles.dataSubtext}>More about weather data and map data</Text>
            
            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder} />
          </View>

          {/* Weather Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailTitle}>Average</Text>
              <Text style={styles.detailValue}>
                {weather && `${Math.round(weather.main.temp)}°`}
              </Text>
              <Text style={styles.detailSubtext}>
                Current temperature
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailTitle}>Feels Like</Text>
              <Text style={styles.detailValue}>
                {weather && `${Math.round(weather.main.feels_like)}°`}
              </Text>
              <Text style={styles.detailSubtext}>
                Feels {Math.round(weather.main.feels_like) > Math.round(weather.main.temp) ? 'warmer' : 'cooler'} than the actual temperature
              </Text>
            </View>
          </View>

          {/* İsterseniz nem ve rüzgar detaylarını da ekleyebiliriz */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailTitle}>Humidity</Text>
              <Text style={styles.detailValue}>
                {weather && `${weather.main.humidity}%`}
              </Text>
              <Text style={styles.detailSubtext}>
                Current humidity level
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailTitle}>Wind Speed</Text>
              <Text style={styles.detailValue}>
                {forecast && `${Math.round(forecast.list[0].wind.speed)} m/s`}
              </Text>
              <Text style={styles.detailSubtext}>
                Current wind conditions
              </Text>
            </View>
          </View>

          {/* Sun Times Card */}
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastTitle}>
                <Ionicons name="sunny-outline" size={20} color="#1F1F1F" />
                <Text style={styles.forecastTitleText}>Güneş Durumu</Text>
              </View>
            </View>
            <View style={styles.sunTimesContainer}>
              <View style={styles.sunTimeItem}>
                <Ionicons name="sunny" size={24} color="#FF7B54" />
                <Text style={styles.sunTimeLabel}>Gün Doğumu</Text>
                <Text style={styles.sunTimeValue}>
                  {weather && new Date(weather.sys.sunrise * 1000).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.sunTimeDivider} />
              <View style={styles.sunTimeItem}>
                <Ionicons name="moon" size={24} color="#4B6CB7" />
                <Text style={styles.sunTimeLabel}>Gün Batımı</Text>
                <Text style={styles.sunTimeValue}>
                  {weather && new Date(weather.sys.sunset * 1000).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Air Quality Card */}
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastTitle}>
                <Ionicons name="leaf-outline" size={20} color="#1F1F1F" />
                <Text style={styles.forecastTitleText}>Hava Kalitesi</Text>
              </View>
            </View>
            <View style={styles.airQualityGrid}>
              {airPollution && (
                <>
                  <View style={styles.airQualityItem}>
                    <Text style={styles.aqiLabel}>PM2.5</Text>
                    <Text style={styles.aqiValue}>
                      {airPollution.list[0].components.pm2_5.toFixed(1)}
                    </Text>
                    <Text style={styles.aqiUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.airQualityItem}>
                    <Text style={styles.aqiLabel}>O₃</Text>
                    <Text style={styles.aqiValue}>
                      {airPollution.list[0].components.o3.toFixed(1)}
                    </Text>
                    <Text style={styles.aqiUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.airQualityItem}>
                    <Text style={styles.aqiLabel}>NO₂</Text>
                    <Text style={styles.aqiValue}>
                      {airPollution.list[0].components.no2.toFixed(1)}
                    </Text>
                    <Text style={styles.aqiUnit}>μg/m³</Text>
                  </View>
                  <View style={styles.airQualityItem}>
                    <Text style={styles.aqiLabel}>SO₂</Text>
                    <Text style={styles.aqiValue}>
                      {airPollution.list[0].components.so2.toFixed(1)}
                    </Text>
                    <Text style={styles.aqiUnit}>μg/m³</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* UV Index Card */}
          <View style={styles.forecastCard}>
            <View style={styles.forecastHeader}>
              <View style={styles.forecastTitle}>
                <Ionicons name="sunny-outline" size={20} color="#1F1F1F" />
                <Text style={styles.forecastTitleText}>UV İndeksi</Text>
              </View>
            </View>
            <View style={styles.uvIndexContainer}>
              <View style={styles.uvMeter}>
                <View style={[styles.uvIndicator, { 
                  width: `${(uvIndex?.value || 0) * 10}%`,
                  backgroundColor: getUVColor(uvIndex?.value || 0)
                }]} />
              </View>
              <Text style={styles.uvValue}>{uvIndex?.value || 0}</Text>
              <Text style={styles.uvDescription}>
                {getUVDescription(uvIndex?.value || 0)}
              </Text>
              <Text style={styles.uvAdvice}>
                {getUVAdvice(uvIndex?.value || 0)}
              </Text>
            </View>
          </View>

          {/* Alt kısımda boşluk bırakmak için */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// UV yardımcı fonksiyonları
const getUVColor = (value: number): string => {
  if (value <= 2) return '#4CAF50';
  if (value <= 5) return '#FFC107';
  if (value <= 7) return '#FF9800';
  if (value <= 10) return '#F44336';
  return '#9C27B0';
};

const getUVDescription = (value: number): string => {
  if (value <= 2) return 'Düşük';
  if (value <= 5) return 'Orta';
  if (value <= 7) return 'Yüksek';
  if (value <= 10) return 'Çok Yüksek';
  return 'Aşırı';
};

const getUVAdvice = (value: number): string => {
  if (value <= 2) return 'Güneş koruyucu kullanmanız önerilmez.';
  if (value <= 5) return '10:00 - 16:00 saatleri arasında güneş koruyucu kullanmanız önerilir.';
  if (value <= 7) return 'Güneş koruyucu kullanmanız ve gölgede kalmanız önerilir.';
  if (value <= 10) return 'Yüksek faktörlü güneş koruyucu kullanın ve dışarı çıkmamaya çalışın.';
  return 'Dışarı çıkmaktan kaçının, çıkmanız gerekirse mutlaka koruyucu önlemler alın.';
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FF7B54',
    zIndex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  mainTemp: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center', // İkonu ortalamak için
  },
  tempText: {
    fontSize: 72,
    color: 'white',
    fontWeight: '300',
  },
  locationText: {
    color: 'white',
    fontSize: 18,
    marginVertical: 5,
  },
  timeText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  forecastCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  forecastTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastTitleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#1F1F1F',
  },
  forecastSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayText: {
    width: 80,
    fontSize: 14,
    color: '#1F1F1F',
  },
  humidityText: {
    width: 50,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  tempRange: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  highTemp: {
    fontSize: 14,
    color: '#FF7B54',
  },
  tempLine: {
    width: 20,
    height: 1,
    backgroundColor: '#DDD',
    marginHorizontal: 5,
  },
  lowTemp: {
    fontSize: 14,
    color: '#4287f5',
  },
  locationSubtext: {
    fontSize: 14,
    color: '#1F1F1F',
    marginBottom: 5,
  },
  dataSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginVertical: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 24,
    color: '#1F1F1F',
    fontWeight: '600',
    marginBottom: 5,
  },
  detailSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: 20,
  },
  weatherIcon: {
    marginBottom: 10,
    alignSelf: 'center',
  },
  locationButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 30,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  cityList: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityIcon: {
    marginRight: 15,
  },
  cityName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  countryName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loaderIconContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
  },
  loaderText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashIconContainer: {
    marginBottom: 30,
  },
  splashText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500',
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  menuButton: {
    padding: 5,
  },
  sunTimesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  sunTimeItem: {
    alignItems: 'center',
  },
  sunTimeDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  sunTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  sunTimeValue: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginTop: 4,
  },
  airQualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  airQualityItem: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  aqiLabel: {
    fontSize: 14,
    color: '#666',
  },
  aqiValue: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
    marginVertical: 5,
  },
  aqiUnit: {
    fontSize: 12,
    color: '#999',
  },
  uvIndexContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  uvMeter: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  uvIndicator: {
    height: '100%',
    backgroundColor: '#FF7B54',
    borderRadius: 4,
  },
  uvValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  uvDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  uvAdvice: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
}); 