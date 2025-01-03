import axios from 'axios';
import { WeatherData } from '../types/weather';

const API_KEY = 'Enter your API key here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface ExtendedWeatherData extends WeatherData {
  coord: {
    lat: number;
    lon: number;
  };
}

export const getWeatherByCoords = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`
    );
    return response.data;
  } catch (error: any) {
    console.error('API Hatası:', error.response?.data || error.message);
    throw new Error('Hava durumu bilgisi alınamadı: ' + (error.response?.data?.message || error.message));
  }
};

export const get5DayForecast = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=tr`
    );
    return response.data;
  } catch (error: any) {
    console.error('Tahmin Hatası:', error.response?.data || error.message);
    throw new Error('Hava tahmini alınamadı: ' + (error.response?.data?.message || error.message));
  }
};

export const getWeatherByCity = async (cityName: string): Promise<ExtendedWeatherData> => {
  try {
    const response = await axios.get(
      `${BASE_URL}/weather?q=${cityName}&units=metric&appid=${API_KEY}&lang=tr`
    );
    return response.data;
  } catch (error: any) {
    console.error('Şehir Arama Hatası:', error.response?.data || error.message);
    throw new Error('Şehir bulunamadı: ' + (error.response?.data?.message || error.message));
  }
};

export const getAirPollution = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Hava Kirliliği Hatası:', error.response?.data || error.message);
    throw new Error('Hava kirliliği verisi alınamadı: ' + (error.response?.data?.message || error.message));
  }
};

export const getUVIndex = async (lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    return response.data;
  } catch (error: any) {
    console.error('UV İndeksi Hatası:', error.response?.data || error.message);
    throw new Error('UV indeksi alınamadı');
  }
}; 