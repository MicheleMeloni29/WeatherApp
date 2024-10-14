import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

import { RouteProp } from '@react-navigation/native';

type HomeScreenRouteProp = RouteProp<{ params: { location: any } }, 'params'>;

const HomeScreen = ({ route }: { route: any }) => {
    interface WeatherData {
        weather: { id: number; main: string; description: string }[];
        main: { temp: number };
        name: string;
    }

    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [locationName, setLocationName] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [locations, setLocations] = useState<WeatherData[]>([]);

    useEffect(() => {
        fetchWeatherData();
    }, []);

    useEffect(() => {
        if (route.params?.location) {
            addLocation(route.params.location);
        }
    }, [route.params?.location]);

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

            // Control data are complete before setting them
            if (!data || !data.weather || !data.weather[0] || !data.main || !data.name) {
                throw new Error('Incomplete weather data from API');
            }

            setWeatherData(data);
        } catch (error) {
            console.error('Error fetching weather data:', error);
            setErrorMsg(`Error fetching weather data: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    // This function returns the card background image based on the weather condition codes
    const getBackgroundImage = (weatherId: number) => {
        if (weatherId >= 200 && weatherId < 300) { // Thunderstorm group
            return require('../../assets/images/Storm.jpg');
        } else if (weatherId >= 300 && weatherId < 400) { // Drizzle group
            return require('../../assets/images/Rain.jpg');
        } else if (weatherId >= 500 && weatherId < 600) { // Rain group
            return require('../../assets/images/Rain.jpg');
        } else if (weatherId >= 600 && weatherId < 700) { // Snow group
            return require('../../assets/images/Snow.jpg');
        } else if (weatherId === 800) { // Clear
            return require('../../assets/images/Sunny.jpg');
        } else if (weatherId === 801) { // Partly cloudy
            return require('../../assets/images/Partly_cloudy.jpg');
        } else if (weatherId >= 802 && weatherId <= 804) { // Cloudy group
            return require('../../assets/images/Cloudy.jpg');
        } else {
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

    const backgroundImage = getBackgroundImage(weatherData?.weather[0]?.id || 0);

    return (
        <View style={styles.container}>
            {/* Bottone per il reload */}
            <TouchableOpacity style={styles.reloadButton} onPress={fetchWeatherData}>
                <Ionicons name="reload" size={30} color="#fff" />
            </TouchableOpacity>

            {/* ScrollView per mostrare le card delle località */}
            <ScrollView horizontal
                contentContainerStyle={styles.scrollView}
                snapToInterval={screenWidth * 0.9}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
            >
                {/* Card della località corrente */}
                <ImageBackground source={backgroundImage} style={styles.cardBackground} imageStyle={styles.cardImage}>
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
                </ImageBackground>
                {/* Card delle località aggiunte */}
                {locations.map((loc, index) => {
                    const locationBackgroundImage = getBackgroundImage(loc.weather[0].id);
                    return (
                        <ImageBackground
                            key={index}
                            source={locationBackgroundImage}
                            style={styles.cardBackground}
                            imageStyle={styles.cardImage}
                        >
                            <View style={styles.card}>
                                <Text style={styles.cityText}>{loc.name || 'Unknown location'}</Text>
                                <Text style={styles.tempText}>{loc.main.temp}°C</Text>
                                <Text style={styles.weatherText}>{loc.weather[0].description}</Text>
                            </View>
                        </ImageBackground>
                    );
                })}
            </ScrollView>

        </View>
    );
}

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    cardBackground: {
        width: screenWidth * 0.9, // Occupa la maggior parte dello schermo
        height: screenHeight * 0.75, // Occupa quasi tutta l'altezza disponibile
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    cardImage: {
        borderRadius: 20, // Arrotonda gli angoli dell'immagine di sfondo
    },
    card: {
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
    },
    reloadButton: {
        position: 'absolute',
        top: 32,
        left: 22,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 10,
        zIndex: 10,
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
