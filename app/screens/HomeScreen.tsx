import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native';
import * as Location from 'expo-location';
import Ionicons from '@expo/vector-icons/Ionicons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../hooks/ThemeProvider';


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;


const HomeScreen = ({ route, navigation }: { route: any; navigation: any }) => {
    const { theme, isDarkMode } = useTheme();
    // This interface defines the structure of the weather data object from the `/forecast` endpoint
    interface WeatherData {
        list: {
            dt: number; // Timestamp
            main: {
                temp: number; // Temperature
                humidity: number; // Humidity
            };
            weather: {
                id: number;
                description: string;
                icon: string;
            }[];
            wind: {
                speed: number; // Wind speed
            };
        }[];
        city: {
            name: string; // City name
        };
    }

    const [currentLocationWeather, setCurrentLocationWeather] = useState<WeatherData | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [locations, setLocations] = useState<WeatherData[]>([]);
    const [savedLocations, setSavedLocations] = useState<any[]>([]); // Store original location data from database
    const scrollViewRef = useRef<ScrollView>(null);
    const [currentIndex, setCurrentIndex] = useState(0);


    // Fetch saved locations from the database
    useEffect(() => {
        const fetchUserLocations = async () => {
            try {
                setLoading(true);
                const auth = getAuth();                                                                 // Get the current user
                const user = auth.currentUser;

                if (user) {
                    const userRef = doc(db, 'users', user.uid);                                         // Get the user document reference
                    const userSnapshot = await getDoc(userRef);                                         // Get the user document snapshot

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();                                           // Get the user data from the snapshot
                        console.log("User data loaded from firestone:", userData);                      // Log the user data

                        if (userData.locations) {                                                       // Check if locations are saved in the database
                            console.log("Location loaded from firestone:", userData.location);          // Log the locations
                            setSavedLocations(userData.locations); // Store original locations from database

                            for (const location of userData.locations) {
                                await addLocation(location);                                            // Add each location to the list
                            }
                        }

                        // Handle new location from route params
                        if (route.params?.location) {
                            console.log('New location added:', route.params.location);                      // Log if a new location is added

                            // Check if this location is already in the savedLocations to avoid duplicates
                            const isDuplicate = userData.locations?.some((savedLoc: any) =>
                                Math.abs(savedLoc.latitude - route.params.location.latitude) < 0.001 &&
                                Math.abs(savedLoc.longitude - route.params.location.longitude) < 0.001
                            );

                            if (!isDuplicate) {
                                await addLocation(route.params.location);                                   // Add the new location to the list only if it's not a duplicate
                            }

                            // Clear the route params to prevent re-adding on next focus
                            navigation.setParams({ location: undefined });
                        }
                    } else {
                        console.log("No user document found in the database");                          // Log if no user document is found

                        // If no user document exists but we have a new location, add it
                        if (route.params?.location) {
                            console.log('New location added to new user:', route.params.location);
                            await addLocation(route.params.location);

                            // Clear the route params to prevent re-adding on next focus
                            navigation.setParams({ location: undefined });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user locations:', error);
                setErrorMsg(`Error fetching locations: ${(error as Error).message}`);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = navigation.addListener('focus', () => {
            setLocations([]); // Clear existing locations to prevent duplicates
            setSavedLocations([]); // Clear saved locations
            setCurrentLocationWeather(null); // Clear current location weather
            fetchCurrentLocationWeather();
            fetchUserLocations();
        });

        return unsubscribe;
    }, [navigation, route.params?.location]);



    // Function to add a new location to the list
    const addLocation = async (location: any) => {
        try {
            if (!location || !location.latitude || !location.longitude) {
                throw new Error("Invalid location data: Location or its coordinates are missing");
            }

            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=283aba4d06e9df5063cd4b9fc5f90c27&units=metric`
            );

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('API Response Error:', errorResponse);
                return;
            }

            const data = await response.json();
            console.log('API Response for location:', data);

            if (data && data.city && data.list && data.list.length) {
                setLocations(prevLocations => [...prevLocations, data]);
            }

        } catch (error) {
            console.error("Error adding location:", error);
            setErrorMsg((error as Error).message);
        }
    };


    // Fetch weather fro the current location 
    const fetchCurrentLocationWeather = async () => {
        try {
            setLoading(true);
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

            const { latitude, longitude } = location.coords;
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=283aba4d06e9df5063cd4b9fc5f90c27&units=metric`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch weather data for the current location');
            }

            const data = await response.json();
            setCurrentLocationWeather(data);
            console.log("Current location weather data:", data);                        // Log to check structure

        } catch (error) {
            console.error('Error fetching current location weather:', error);
            setErrorMsg(`Error: ${(error as Error).message}`);
        } finally {
            setLoading(false);
        }
    }


    // Function to remove a location from the list and database
    const removeLocation = async (index: number) => {
        try {
            // Get the location to remove from the weather data
            const locationToRemove = locations[index];
            if (!locationToRemove || !locationToRemove.city) {
                console.error('Invalid location to remove');
                return;
            }

            // Remove from local state first
            setLocations((prevLocations) => prevLocations.filter((_, i) => i !== index));

            // Find and remove from savedLocations based on city name and coordinates
            const updatedSavedLocations = savedLocations.filter((savedLocation) => {
                // We need to match based on coordinates since that's the most reliable identifier
                // The savedLocation should have latitude and longitude properties
                return !(
                    Math.abs(savedLocation.latitude - savedLocation.latitude) < 0.001 &&
                    Math.abs(savedLocation.longitude - savedLocation.longitude) < 0.001
                );
            });

            // For more reliable matching, let's find the corresponding saved location by index
            // Since locations are loaded in the same order, the index should match
            const locationIndex = Math.min(index, savedLocations.length - 1);
            const updatedSavedLocationsByIndex = savedLocations.filter((_, i) => i !== locationIndex);

            setSavedLocations(updatedSavedLocationsByIndex);

            // Update the database
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    locations: updatedSavedLocationsByIndex
                });
                console.log('Location removed from database successfully');
            }

        } catch (error) {
            console.error('Error removing location:', error);
            setErrorMsg(`Error removing location: ${(error as Error).message}`);
        }
    };


    // Function to obtain the background image of the card based on the weather conditions ID
    const getBackgroundImage = (weatherId: number) => {
        switch (true) {
            case (weatherId >= 200 && weatherId < 300):
                return require('../../assets/images/Storm.jpg');
            case (weatherId >= 300 && weatherId < 400):
                return require('../../assets/images/Rain.jpg');
            case (weatherId >= 500 && weatherId < 600):
                return require('../../assets/images/Rain.jpg');
            case (weatherId >= 600 && weatherId < 700):
                return require('../../assets/images/Snow.jpg');
            case (weatherId === 800):
                return require('../../assets/images/Sunny.jpg');
            case (weatherId === 801):
                return require('../../assets/images/Partly_cloudy.jpg');
            case (weatherId >= 802 && weatherId <= 804):
                return require('../../assets/images/Cloudy.jpg');
            default:
                return require('../../assets/images/default_weather.jpg');
        }
    };


    const backgroundImage = getBackgroundImage(weatherData?.list?.[0]?.weather?.[0]?.id || 0);


    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.errorText, { color: theme.error }]}>{errorMsg}</Text>
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                        setErrorMsg(null);
                        fetchCurrentLocationWeather();
                    }}
                >
                    <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }



    // Function to obtain temperature color based on the value
    const getTemperatureColor = (temp: number) => {
        if (temp < -10) {
            return 'fucsia'
        } else if (temp >= -10 && temp < 0) {
            return 'blue'
        } else if (temp >= 0 && temp < 10) {
            return 'lightblue'
        } else if (temp >= 10 && temp < 20) {
            return 'green'
        } else if (temp >= 20 && temp < 30) {
            return 'gold'
        } else if (temp >= 30 && temp < 40) {
            return 'orange'
        } else {
            return 'red'
        }
    };

    // How to display the weather data
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <TouchableOpacity style={[styles.reloadButton, { backgroundColor: theme.primary }]} onPress={fetchCurrentLocationWeather}>
                <Ionicons name="reload" size={20} color="#fff" />
            </TouchableOpacity>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={screenWidth}
                snapToAlignment="center"
                scrollEnabled={true}
                onScroll={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                    setCurrentIndex(index);
                }}
            >
                {/* Card per la posizione corrente */}
                {currentLocationWeather && currentLocationWeather.list && currentLocationWeather.list.length && (
                    <ImageBackground
                        source={getBackgroundImage(currentLocationWeather.list[0].weather[0].id)}
                        style={styles.cardBackground}
                        imageStyle={styles.cardImage}
                    >
                        <View style={styles.card}>
                            <Text style={styles.cityText}>{currentLocationWeather.city.name || 'Unknown location'}</Text>
                            <Text style={styles.weatherText}>{currentLocationWeather.list?.[0]?.weather[0]?.description || 'No description'}</Text>
                            <Text style={[styles.tempText, { color: getTemperatureColor(currentLocationWeather.list?.[0]?.main?.temp) }]}>
                                {Math.round(currentLocationWeather.list?.[0]?.main?.temp) ?? '--'}°C
                            </Text>
                            <View style={styles.windHumidityContainer}>
                                <Text style={styles.windText}>Wind: {Math.round(currentLocationWeather.list?.[0]?.wind?.speed ?? 0)} m/s</Text>
                                <Text style={styles.humidityText}>Humidity: {currentLocationWeather.list?.[0]?.main?.humidity ?? '--'}%</Text>
                            </View>
                            {/* Forecast next 12 hours */}
                            <View style={styles.hourlyForecast}>
                                {currentLocationWeather.list?.slice(0, 8).map((hour, idx) => (
                                    <View key={idx} style={styles.hourItem}>
                                        <Image
                                            source={{ uri: `https://openweathermap.org/img/wn/${hour.weather[0]?.icon}@2x.png` }}
                                            style={styles.weatherIcon}
                                        />
                                        <Text>{new Date(hour.dt * 1000).getHours()}:00</Text>
                                        <Text>{Math.round(hour.main?.temp ?? '--')}°C</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Weekly forecast */}
                            <View style={styles.dailyForecast}>
                                {currentLocationWeather.list?.filter((_, idx) => idx % 8 === 0).slice(0, 7).map((day, idx) => (
                                    <View key={idx} style={styles.dailyItem}>
                                        <Text style={styles.dayText}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                        <Image
                                            source={{ uri: `https://openweathermap.org/img/wn/${day.weather[0]?.icon}@2x.png` }}
                                            style={styles.weatherIcon}
                                        />
                                        <Text style={styles.minMaxText}>
                                            {Math.round(day.main?.temp ?? '--')}°C
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ImageBackground>
                )}

                {/* Card per le località aggiunte */}
                {locations.length > 0 && locations.map((location, index) => (
                    location && location.list && location.list[0] && location.list[0].weather && (
                        <ImageBackground
                            key={index}
                            source={getBackgroundImage(location.list[0].weather[0].id)}
                            style={styles.cardBackground}
                            imageStyle={styles.cardImage}
                        >
                            <View style={styles.card}>
                                <Text style={styles.cityText}>{location.city?.name || 'Unknown location'}</Text>
                                <Text style={styles.weatherText}>{location.list?.[0]?.weather[0]?.description || 'No description'}</Text>
                                <Text style={[styles.tempText, { color: getTemperatureColor(location.list?.[0]?.main?.temp) }]}>
                                    {Math.round(location.list?.[0]?.main?.temp ?? '--')}°C
                                </Text>
                                <View style={styles.windHumidityContainer}>
                                    <Text style={styles.windText}>Wind: {Math.round(location.list?.[0]?.wind?.speed ?? 0)} m/s</Text>
                                    <Text style={styles.humidityText}>Humidity: {location.list?.[0]?.main?.humidity ?? '--'}%</Text>
                                </View>
                                {/* Forecast next 12 hours */}
                                <View style={styles.hourlyForecast}>
                                    {location.list?.slice(0, 8).map((hour, idx) => (
                                        <View key={idx} style={styles.hourItem}>
                                            <Image
                                                source={{ uri: `https://openweathermap.org/img/wn/${hour.weather[0]?.icon}@2x.png` }}
                                                style={styles.weatherIcon}
                                            />
                                            <Text>{new Date(hour.dt * 1000).getHours()}:00</Text>
                                            <Text>{Math.round(hour.main?.temp ?? '--')}°C</Text>
                                        </View>
                                    ))}
                                </View>
                                {/* Weekly forecast */}
                                <View style={styles.dailyForecast}>
                                    {location.list?.filter((_, idx) => idx % 8 === 0).slice(0, 7).map((day, idx) => (
                                        <View key={idx} style={styles.dailyItem}>
                                            <Text style={styles.dayText}>{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                            <Image
                                                source={{ uri: `https://openweathermap.org/img/wn/${day.weather[0]?.icon}@2x.png` }}
                                                style={styles.weatherIcon}
                                            />
                                            <Text style={styles.minMaxText}>
                                                {Math.round(day.main?.temp ?? '--')}°C
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity style={styles.deleteButton} onPress={() => removeLocation(index)}>
                                    <Ionicons name="trash" size={24} color="red" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    )))}
            </ScrollView>

            {/* Indicatore di posizione */}
            <View style={styles.pagination}>
                {[
                    ...(currentLocationWeather ? [0] : []),
                    ...locations.map((_, index) => index + (currentLocationWeather ? 1 : 0))
                ].map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            { backgroundColor: currentIndex === index ? '#333' : '#ccc' },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

export default HomeScreen;


// Styles
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
        width: screenWidth * 1,
        height: screenHeight * 0.8,
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
        left: '50%',
        marginLeft: -20,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 10,
        zIndex: 10,
    },
    cityText: {
        fontSize: 24,
        fontWeight: 'bold',
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
        position: 'absolute',
        right: 10,
        top: 5,
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
    pagination: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    hourlyForecast: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
    },
    hourItem: {
        alignItems: 'center',
    },
    dailyForecast: {
        marginTop: 20,
        width: '100%',
    },
    dailyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    dayText: {
        fontSize: 18,
    },
    minMaxText: {
        fontSize: 18,
    },
    weatherIcon: {
        width: 50,
        height: 50,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    retryButton: {
        backgroundColor: '#6EC1E4',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

