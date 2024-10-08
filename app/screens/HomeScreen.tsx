import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons'; // Importa Ionicons

const screenWidth = Dimensions.get('window').width;

import { RouteProp } from '@react-navigation/native';

type HomeScreenRouteProp = RouteProp<{ params: { location: any } }, 'params'>;

export default function HomeScreen({ route }: { route: HomeScreenRouteProp }) {
    interface WeatherData {
        weather: { main: string; description: string }[];
        main: { temp: number };
        name: string;
    }

    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [locationName, setLocationName] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [locations, setLocations] = useState<WeatherData[]>([]); // State to store all locations

    useEffect(() => {
        fetchWeatherData();
    }, []);

    useEffect(() => {
        if (route.params?.location) {
            addLocation(route.params.location); // Add the new location to the state
        }
    }, [route.params?.location]);

    useEffect(() => {
        console.log('Updated locations:', locations);
    }, [locations]);

    const addLocation = (location: WeatherData) => {
        if (!location.weather || !location.weather[0] || !location.weather[0].main) {
            console.warn('Incomplete weather data for location:', location);
        }
        setLocations((prevLocations) => [...prevLocations, location]);
    };

    const fetchWeatherData = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (reverseGeocode.length > 0) {
                let geocodeData = reverseGeocode[0];
                setLocationName(`${geocodeData.city}, ${geocodeData.country}`);
            } else {
                setLocationName('Unknown location');
            }

            await fetchWeather(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Error while getting location:', error);
            setErrorMsg('Error while getting location');
            setLoading(false);
        }
    };

    const fetchWeather = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=283aba4d06e9df5063cd4b9fc5f90c27&units=metric`
            );

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('API Response Error:', errorResponse);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorResponse.message}`);
            }

            const data = await response.json();
            console.log('Weather data:', data);
            setWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            setErrorMsg(`Error fetching weather data: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    const getBackgroundImage = (conditions: string) => {
        switch (conditions.toLowerCase()) {
            case 'partly cloudy':
                return require('../../assets/images/Partly_cloudy.jpg');
            case 'clear':
                return require('../../assets/images/Sunny.jpg');
            case 'rain':
                return require('../../assets/images/Rain.jpg');
            case 'snow':
                return require('../../assets/images/Snow.jpg');
            case 'cloudy':
                return require('../../assets/images/Cloudy.jpg');
            case 'storm':
                return require('../../assets/images/Storm.jpg');
            default:
                return require('../../assets/images/default_weather.jpg');
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const backgroundImage = getBackgroundImage(weatherData?.weather[0]?.main || '');

    return (
        <ImageBackground source={backgroundImage} style={styles.background}>
            {/* Bottone per il reload, posizionato in primo piano */}
            <TouchableOpacity style={styles.reloadButton} onPress={fetchWeatherData}>
                <Ionicons name="reload" size={30} color="#fff" />
            </TouchableOpacity>

            {/* ScrollView per mostrare le card delle località */}
            <ScrollView horizontal contentContainerStyle={styles.scrollView}>
                <View style={styles.card}>
                    {errorMsg ? (
                        <Text>{errorMsg}</Text>
                    ) : (
                        weatherData && (
                            <>
                                <Text style={styles.cityText}>{weatherData.name || 'Unknown location'}</Text>
                                <Text style={styles.tempText}>{weatherData.main.temp}°C</Text>
                                <Text style={styles.weatherText}>{weatherData.weather[0].description}</Text>
                            </>
                        )
                    )}
                </View>

                {locations.map((loc, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.cityText}>{loc.name || 'Unknown location'}</Text>
                        {loc.weather && loc.weather[0] && (
                            <>
                                <Text style={styles.tempText}>{loc.main.temp}°C</Text>
                                {loc.weather[0] && <Text style={styles.weatherText}>{loc.weather[0].description}</Text>}
                            </>
                        )}
                    </View>
                ))}

            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
    },
    container: {

    },
    scrollView: {
        flexDirection: 'row',
        alignItems: 'center', // Centra verticalmente le card
        justifyContent: 'center', // Centra orizzontalmente il contenuto
        paddingVertical: 40, // Distanza dalla parte superiore e inferiore della schermata
    },
    card: {
        width: screenWidth * 0.8,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        alignItems: 'center',
        alignContent: 'center',
        marginHorizontal: 10,
    },
    reloadButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 5,
        zIndex: 10, // Assicura che il bottone sia in primo piano
    },
    cityText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    tempText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ff8c00',
    },
    weatherText: {
        fontSize: 18,
        color: '#333',
    },
});
