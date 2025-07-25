/**
 * AddLocation component allows users to search for a location, view it on a map, and add it to their saved locations.
 *
 * @component
 * @param {Props} props - The props for the component.
 * @param {object} props.navigation - The navigation object provided by React Navigation.
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @example
 * <AddLocation navigation={navigation} />
 *
 * @remarks
 * This component uses the Location API to get the user's current location and display it on a map.
 * It also provides an autocomplete search bar to search for locations and add them to the user's saved locations.
 *
 * @function
 * @name AddLocation
 *
 * @typedef {object} LocationType
 * @property {string} name - The name of the location.
 * @property {number} latitude - The latitude of the location.
 * @property {number} longitude - The longitude of the location.
 * @property {string} type - The type of the location (e.g., city, town, village).
 * @property {number} [distance] - The distance to the location (optional).
 *
 * @typedef {object} Props
 * @property {object} navigation - The navigation object provided by React Navigation.
 *
 * @hook
 * @name useEffect
 * @description Requests location permission and gets the user's current location when the component mounts.
 *
 * @hook
 * @name useState
 * @description Manages the state for query, filteredCities, loading, selectedLocation, region, and loadingCurrentPosition.
 *
 * @hook
 * @name useRef
 * @description Creates references for mapRef, currentLocation, and defaultRegion.
 *
 * @function
 * @name debounce
 * @description Debounces a function to limit API calls.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} The debounced function.
 *
 * @function
 * @name fetchLocationSuggestions
 * @description Fetches location suggestions based on the text input.
 * @param {string} text - The text input to search for locations.
 *
 * @function
 * @name handleSelectCity
 * @description Handles the selection of a city from the autocomplete list.
 * @param {LocationType} city - The selected city.
 *
 * @function
 * @name handleAddLocation
 * @description Handles the addition of a location to the user's saved locations.
 *
 * @function
 * @name handleRefresh
 * @description Refreshes the current location and updates the map.
 *
 * @returns {JSX.Element} The rendered component.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Autocomplete from 'react-native-autocomplete-input';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../navigators/MainTabNavigator';
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useTheme } from '../../hooks/ThemeProvider';


type AddLocationScreenNavigationProp = StackNavigationProp<MainTabParamList, 'AddLocation'>;
type AddLocationScreenRouteProp = RouteProp<MainTabParamList, 'AddLocation'>;


type Props = {
    navigation: AddLocationScreenNavigationProp;
    route: AddLocationScreenRouteProp;
};

export type LocationType = {
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
};


const AddLocation: React.FC<Props> = ({ navigation }) => {
    const { theme, isDarkMode } = useTheme();
    const [query, setQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState<LocationType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null);
    const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
    const mapRef = useRef<MapView>(null);
    const currentLocation = useRef<{ latitude: number; longitude: number } | null>(null);
    const [loadingCurrentPosition, setLoadingCurrentPosition] = useState(false);
    const defaultRegion = useRef<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);


    // Get the current location of the user
    useEffect(() => {
        const requestLocationPermission = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.error('Permission to access location was denied');
                    // Set a default region if permission is denied
                    const defaultReg = {
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };
                    setRegion(defaultReg);
                    defaultRegion.current = defaultReg;
                    return;
                }

                // Always try to get the current location first
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High,
                    });
                    const { latitude, longitude } = location.coords;

                    const currentRegion = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };

                    // Update map with current location
                    setRegion(currentRegion);
                    defaultRegion.current = currentRegion;
                    currentLocation.current = { latitude, longitude };

                    mapRef.current?.animateToRegion(currentRegion, 1000);
                    return; // Exit early if we got current location successfully
                } catch (currentLocationError) {
                    console.log('Could not get current location, trying last known location');
                }

                // Fallback to last known location if current location fails
                const lastKnownLocation = await Location.getLastKnownPositionAsync({});

                if (lastKnownLocation) {
                    const { latitude, longitude } = lastKnownLocation.coords;
                    const newRegion = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };

                    setRegion(newRegion);
                    defaultRegion.current = newRegion;
                    currentLocation.current = { latitude, longitude };

                    mapRef.current?.animateToRegion(newRegion, 1000);
                } else {
                    // Final fallback to default location
                    const defaultReg = {
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    };
                    setRegion(defaultReg);
                    defaultRegion.current = defaultReg;
                }

            } catch (error) {
                console.error('Error getting location:', error);
                // Set a default region if there's an error
                const defaultReg = {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                };
                setRegion(defaultReg);
                defaultRegion.current = defaultReg;
            }
        };

        requestLocationPermission();
    }, []);




    // Debounce function to limit API calls
    const debounce = (func: Function, delay: number) => {
        let timer: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    // Fetch location suggestions based on the text input
    const fetchLocationSuggestions = useCallback(
        debounce(async (text: string) => {
            if (text.length < 1) {
                setFilteredCities([]);
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(
                    `https://api.locationiq.com/v1/autocomplete.php?key=pk.50885526f1e3429619457922e2499771&q=${text}&limit=10&format=json`
                );

                const data = await response.json();

                if (Array.isArray(data)) {
                    const suggestions = data
                        .map((location: any) => ({
                            name: location.display_name,
                            latitude: parseFloat(location.lat),
                            longitude: parseFloat(location.lon),
                            type: location.type,
                        }))
                        .filter((location: { name: string; type: string }) => {
                            return location.type === 'city' || location.type === 'town' || location.type === 'village';
                        });

                    setFilteredCities(suggestions);
                } else {
                    console.error('Unexpected data format:', data);
                    setFilteredCities([]);
                }
            } catch (error) {
                console.error('Error fetching location suggestions:', error);
                if ((error as Error).message.includes('Rate Limited')) {
                    alert('Rate limit exceeded, please wait a moment before trying again.');
                }
            } finally {
                setLoading(false);
            }
        }, 1000),
        []
    );


    // Handle the selection of a city from the autocomplete list
    const handleSelectCity = (city: LocationType) => {
        if (city && city.latitude && city.longitude) {
            setQuery(city.name);
            setSelectedLocation(city);
            setFilteredCities([]);

            mapRef.current?.animateToRegion(
                {
                    latitude: city.latitude,
                    longitude: city.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000
            );
            setTimeout(() => {
                setLoadingCurrentPosition(false);
            }, 1000);
        } else {
            console.warn('Invalid city selected');
        }
    };


    // Handle the addition of a location
    const handleAddLocation = async () => {
        if (selectedLocation && selectedLocation.name && selectedLocation.latitude && selectedLocation.longitude) {
            const formattedLocation: LocationType = {
                name: selectedLocation.name,
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
            };

            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (user) {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userSnapshot = await getDoc(userDocRef);

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();

                        // Check if the location already exists in the user's saved locations
                        const existingLocations = userData.locations || [];
                        const locationExists = existingLocations.some((location: LocationType) =>
                            location.name === formattedLocation.name
                        );

                        if (locationExists) {
                            alert('The selected location is already in your HomeScreen.');
                            return; // Exit the function if the location is already added
                        }

                        // Update the user document with the new location
                        await updateDoc(userDocRef, {
                            locations: arrayUnion(formattedLocation),
                        });
                    } else {
                        // Create the user document with the new location
                        await setDoc(userDocRef, { locations: [formattedLocation] });
                    }

                    console.log('Location saved to Firestore:', formattedLocation);
                }

                // Navigate to HomeScreen with the new location
                navigation.navigate('Home', { location: formattedLocation } as any);

            } catch (error) {
                console.error('Error saving location:', error);
                alert('Failed to save location. Please try again later.');
            }

            // Reset the states to clear the map and the selected location
            setSelectedLocation(null);
            setQuery('');
            setFilteredCities([]);
            setRegion(defaultRegion.current);
        } else {
            console.warn('No valid location selected');
            alert('Please select a valid location before adding it.');
        }
    };



    // Handle map press to select a location
    const handleMapPress = async (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;

        try {
            setLoading(true);

            // Use reverse geocoding to get the location name
            const response = await fetch(
                `https://api.locationiq.com/v1/reverse.php?key=pk.50885526f1e3429619457922e2499771&lat=${latitude}&lon=${longitude}&format=json`
            );

            const data = await response.json();

            if (data && data.display_name) {
                const newLocation: LocationType = {
                    name: data.display_name,
                    latitude: latitude,
                    longitude: longitude,
                };

                setSelectedLocation(newLocation);
                setQuery(data.display_name);
                setFilteredCities([]);

                console.log('Location selected from map:', newLocation);
            } else {
                // If reverse geocoding fails, create a generic location name
                const genericName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                const newLocation: LocationType = {
                    name: genericName,
                    latitude: latitude,
                    longitude: longitude,
                };

                setSelectedLocation(newLocation);
                setQuery(genericName);
                setFilteredCities([]);
            }

        } catch (error) {
            console.error('Error with reverse geocoding:', error);

            // Fallback: create location with coordinates
            const fallbackName = `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            const fallbackLocation: LocationType = {
                name: fallbackName,
                latitude: latitude,
                longitude: longitude,
            };

            setSelectedLocation(fallbackLocation);
            setQuery(fallbackName);
            setFilteredCities([]);
        } finally {
            setLoading(false);
        }
    };
    const handleRefresh = useCallback(async () => {
        setQuery('');               // Clear the search bar content
        setFilteredCities([]);      // Clear the suggestions list
        setSelectedLocation(null);  // Clear selected location

        setLoadingCurrentPosition(true);

        try {
            // Get permission first
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                alert('Permission to access location was denied. Please enable location services to use this feature.');
                setLoadingCurrentPosition(false);
                return;
            }

            // Try to get the current location with high accuracy
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = location.coords;

            // Update the map area with the new position
            const newRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            };

            // Set the map to the new region with animation
            mapRef.current?.animateToRegion(newRegion, 1000);

            // Reset the region state to reflect the new position
            setRegion(newRegion);
            defaultRegion.current = newRegion;
            currentLocation.current = { latitude, longitude };

        } catch (error) {
            console.error('Error refreshing current location:', error);
            alert('Failed to get current location. Please check your location permissions and ensure GPS is enabled.');
        } finally {
            setTimeout(() => {
                setLoadingCurrentPosition(false);
            }, 1000);
        }
    }, []);



    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.searchContainer}>
                <Autocomplete
                    containerStyle={styles.autocompleteContainer}
                    data={filteredCities.length > 0 ? filteredCities : []}
                    defaultValue={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        fetchLocationSuggestions(text);
                    }}
                    placeholder="Search for a city or a location..."
                    placeholderTextColor={theme.textSecondary}
                    flatListProps={{
                        keyExtractor: (item) => item.name,
                        ListEmptyComponent: () => <Text style={[styles.noResultText, { color: theme.textSecondary }]}>No results found</Text>,
                        renderItem: ({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCity(item)}>
                                <Text style={[styles.itemText, {
                                    color: theme.text,
                                    borderBottomColor: theme.border,
                                    backgroundColor: theme.cardBackground
                                }]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        ),
                    }}
                    style={[styles.input, {
                        backgroundColor: theme.inputBackground,
                        color: theme.text
                    }]}
                    autoCorrect={false}
                />
                <TouchableOpacity style={[styles.refreshButton, { backgroundColor: theme.primary }]} onPress={handleRefresh} disabled={loadingCurrentPosition}>
                    {loadingCurrentPosition ? (
                        <ActivityIndicator size="small" color={theme.buttonText} />
                    ) : (
                        <Ionicons name="refresh" size={24} color={theme.buttonText} />
                    )}
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color={theme.primary} />}

            <MapView
                ref={mapRef}
                style={styles.map}
                // Set the region to the current location or the selected location
                region={region || {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1
                }}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
            >
                {selectedLocation && (
                    <Marker
                        coordinate={{ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }}
                        title={selectedLocation.name}
                        description={`Lat: ${selectedLocation.latitude.toFixed(4)}, Lon: ${selectedLocation.longitude.toFixed(4)}`}
                    />
                )}
            </MapView>

            <TouchableOpacity
                style={[
                    styles.addButton,
                    { backgroundColor: theme.primary },
                    !selectedLocation && [styles.disabledButton, { backgroundColor: theme.textSecondary }]
                ]}
                onPress={handleAddLocation}
                disabled={!selectedLocation}
            >
                <Text style={[
                    styles.addButtonText,
                    { color: theme.buttonText },
                    !selectedLocation && [styles.disabledButtonText, { color: theme.background }]
                ]}>
                    Add Location
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default AddLocation;

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        // backgroundColor will be set dynamically via theme
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        zIndex: 2,
    },
    autocompleteContainer: {
        flex: 1,
        borderWidth: 0,
        zIndex: 10,
    },
    noResultText: {
        // color will be set dynamically via theme
        padding: 10,
        textAlign: 'center',
    },
    input: {
        borderWidth: 0,
        borderRadius: 5,
        padding: 10,
        // backgroundColor and color will be set dynamically via theme
    },
    refreshButton: {
        // backgroundColor will be set dynamically via theme
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        width: 44,
        height: 44,
    },
    itemText: {
        padding: 10,
        borderBottomWidth: 1,
        // color, borderBottomColor, backgroundColor will be set dynamically via theme
    },
    map: {
        flex: 1,
        width: '100%',
        marginTop: 80,
        position: 'absolute',
        top: 10,
        bottom: 100,
        left: 20,
        borderRadius: 10,
    },
    addButton: {
        // backgroundColor will be set dynamically via theme
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        width: '100%',
        left: 20,
        padding: 10,
    },
    addButtonText: {
        // color will be set dynamically via theme
        fontSize: 25,
    },
    disabledButton: {
        // backgroundColor will be set dynamically via theme
        opacity: 0.6,
    },
    disabledButtonText: {
        // color will be set dynamically via theme
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 0,
        paddingHorizontal: 10,
    },
});
