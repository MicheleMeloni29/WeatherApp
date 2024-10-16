import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

import { RouteProp } from '@react-navigation/native';

type HomeScreenRouteProp = RouteProp<{ params: { location: any } }, 'params'>;

const HomeScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    interface WeatherData {
        weather: { id: number; main: string; description: string }[];
        main: { temp: number };
        wind_speed: number; // Velocità del vento
        humidity: number;   // Umidità
        name: string;
    }

    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [locationName, setLocationName] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [locations, setLocations] = useState<WeatherData[]>([]);

    useEffect(() => {
        fetchWeatherData();

        if (route.params?.location) {
            console.log('New location added:', route.params.location);
            addLocation(route.params.location);
        } else {
            console.log('No location passed from AddLocation screen');
        }
    }, [route.params?.location]);


    // Funzione per aggiungere una nuova località
    const addLocation = async (location: any) => {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=283aba4d06e9df5063cd4b9fc5f90c27&units=metric`
            );

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('API Response Error:', errorResponse);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorResponse.message}`);
            }

            const weatherData = await response.json();

            // Verifica che i dati abbiano la struttura prevista
            if (!weatherData || !weatherData.weather || !Array.isArray(weatherData.weather) || !weatherData.weather[0] || !weatherData.main) {
                console.warn('Incomplete or malformed weather data for location:', location);
                return;
            }

            // Aggiungi la località solo se non è già presente nell'elenco
            const isLocationAlreadyAdded = locations.some((loc) => loc.name === weatherData.name);
            if (isLocationAlreadyAdded) {
                console.warn('Location already added:', weatherData.name);
                return;
            }

            // Aggiorna lo stato con i dati della nuova località
            setLocations((prevLocations) => [
                ...prevLocations,
                {
                    ...weatherData,
                    wind_speed: weatherData.wind ? weatherData.wind.speed : 0, // Verifica che `wind` esista
                    humidity: weatherData.main.humidity || 0,
                },
            ]);

            // Resetta il parametro "location" per evitare duplicati
            navigation.setParams({ location: null });
        } catch (error) {
            console.error('Error fetching weather data for location:', error);
        }
    };




    // Funzione per ottenere i dati meteo della posizione corrente
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
            if (!location || !location.coords) {
                throw new Error('Location data is undefined');
            }

            fetchWeather(location.coords.latitude, location.coords.longitude);
        } catch (error) {
            console.error('Error while getting location:', error);
            setErrorMsg(`Error while getting location: ${(error as Error).message}`);
            setLoading(false);
        }
    };

    // Funzione per ottenere i dati meteo in base alla latitudine e longitudine
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

            // Verifica che i dati siano completi prima di impostarli
            if (!data || !data.weather || !Array.isArray(data.weather) || !data.weather[0] || !data.main) {
                throw new Error('Incomplete weather data from API');
            }

            setWeatherData({
                weather: data.weather,
                main: { temp: data.main.temp },
                wind_speed: data.wind ? data.wind.speed : 0, // Verifica che `wind` esista
                humidity: data.main.humidity || 0,
                name: data.name,
            });
        } catch (error) {
            console.error('Error fetching weather data:', error);
            setErrorMsg(`Error fetching weather data: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    };



    const removeLocation = (index: number) => {
        setLocations((prevLocations) => prevLocations.filter((_, i) => i !== index));
    };

    // Funzione per ottenere l'immagine di sfondo della card in base all'id delle condizioni meteo
    const getBackgroundImage = (weatherId: number) => {
        if (weatherId >= 200 && weatherId < 300) {
            return require('../../assets/images/Storm.jpg');
        } else if (weatherId >= 300 && weatherId < 400) {
            return require('../../assets/images/Rain.jpg');
        } else if (weatherId >= 500 && weatherId < 600) {
            return require('../../assets/images/Rain.jpg');
        } else if (weatherId >= 600 && weatherId < 700) {
            return require('../../assets/images/Snow.jpg');
        } else if (weatherId === 800) {
            return require('../../assets/images/Sunny.jpg');
        } else if (weatherId === 801) {
            return require('../../assets/images/Partly_cloudy.jpg');
        } else if (weatherId >= 802 && weatherId <= 804) {
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
            <ScrollView
                horizontal
                contentContainerStyle={styles.scrollView}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
            >
                {/* Card della località corrente */}
                <ImageBackground
                    source={backgroundImage}
                    style={styles.cardBackground}
                    imageStyle={styles.cardImage}
                >
                    <View style={styles.card}>
                        {errorMsg ? (
                            <Text>{errorMsg}</Text>
                        ) : weatherData && weatherData.weather && weatherData.main ? (
                            <>
                                <Text style={styles.cityText}>{weatherData.name || 'Unknown location'}</Text>
                                <Text style={styles.weatherText}>{weatherData.weather[0].description}</Text>
                                <Text style={styles.tempText}>{Math.round(weatherData.main.temp)}°C</Text>
                                <View style={styles.windHumidityContainer}>
                                    <Text style={styles.windText}>Wind: {Math.round(weatherData.wind_speed)} m/s</Text>
                                    <Text style={styles.humidityText}>Humidity: {weatherData.humidity}%</Text>
                                </View>
                            </>
                        ) : (
                            <Text>No weather data available</Text>
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
                                <Text style={styles.weatherText}>{loc.weather[0].description}</Text>
                                <Text style={styles.tempText}>{Math.round(loc.main.temp)}°C</Text>
                                <View style={styles.windHumidityContainer}>
                                    <Text style={styles.windText}>Wind: {Math.round(loc.wind_speed)} m/s</Text>
                                    <Text style={styles.humidityText}>Humidity: {loc.humidity}%</Text>
                                </View>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeLocation(index)}>
                                    <Ionicons name="trash" size={24} color="red" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    );
                })}

            </ScrollView>
        </View>
    );
};

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
        width: screenWidth * 1, // Occupa la maggior parte dello schermo
        height: screenHeight * 0.8, // Occupa quasi tutta l'altezza disponibile
        justifyContent: 'center',
    },
    cardImage: {
    },
    card: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
        //marginBottom: 10,
    },
    tempText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#ff8c00',
    },
    weatherText: {
        fontSize: 20,
        color: '#333',
    },
    deleteButton: {
        marginTop: 20,
    },
    windHumidityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    windText: {
        fontSize: 18,
        color: '#333',
        marginTop: 10,
    },
    humidityText: {
        fontSize: 18,
        color: '#333',
        marginTop: 10,
    },
});
