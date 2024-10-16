import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Autocomplete from 'react-native-autocomplete-input';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '../../index';
import debounce from 'lodash/debounce';

type AddLocationScreenNavigationProp = StackNavigationProp<MainTabParamList, 'AddLocation'>;
type AddLocationScreenRouteProp = RouteProp<MainTabParamList, 'AddLocation'>;

type Props = {
    navigation: AddLocationScreenNavigationProp;
    route: AddLocationScreenRouteProp;
};

type LocationType = {
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
};

const AddLocation: React.FC<Props> = ({ navigation }) => {
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
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Set the map region to the current location with a greater zoom
            const initialRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 20,  // Greater zoom
                longitudeDelta: 20, // Greater zoom
            };

            setRegion(initialRegion);
            currentLocation.current = { latitude, longitude };

            // Store the default region (used for dezoom)
            defaultRegion.current = {
                latitude,
                longitude,
                latitudeDelta: 20,  // Lesser zoom
                longitudeDelta: 20, // Lesser zoom
            };
        };
        requestLocationPermission();
    }, []);

    // Debounce function to limit API calls
    const debounce = (func: Function, delay: number) => {
        let timer: NodeJS.Timeout;
        return (...args: any[]) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        }
    }

    // Fetch location suggestions based on the text input
    const fetchLocationSuggestions = useCallback(debounce(async (text: string) => {
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
                    .filter((location: { name: string, type: string }) => {
                        return location.type === 'city' || location.type === 'town' || location.type === 'village';
                    });

                if (currentLocation.current) {
                    const sortedSuggestions = sortLocationsByDistance(suggestions);
                    setFilteredCities(sortedSuggestions);
                } else {
                    setFilteredCities(suggestions);
                }
            } else {
                console.error('Unexpected data format:', data);
                setFilteredCities([]);
            }
        } catch (error) {
            if ((error as Error).message.includes("Rate Limited")) {
                console.error('Rate limit exceeded, please wait a moment before trying again.');
                alert('Rate limit exceeded, please wait a moment before trying again.');
            } else {
                console.error('Error fetching location suggestions:', error);
            }
        } finally {
            setLoading(false);
        }
    }, 1000), []); // 1000 ms di debounce

    const fetchLocationSuggestionsDebounced = useCallback(debounce(fetchLocationSuggestions, 500), []);

    // Sort locations by distance from the current location 
    const sortLocationsByDistance = (locations: LocationType[]) => {
        return locations
            .map((city) => {
                if (currentLocation.current) {
                    const distance = calculateDistance(currentLocation.current.latitude, currentLocation.current.longitude, city.latitude, city.longitude);
                    return { ...city, distance };
                }
                return city;
            })
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    };

    // Calculate the distance between two coordinates
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const handleSelectCity = (city: LocationType) => {
        setQuery(city.name);
        setSelectedLocation(city);
        setFilteredCities([]);

        mapRef.current?.animateToRegion({
            latitude: city.latitude,
            longitude: city.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
        }, 1000);

        setTimeout(() => {
            setLoadingCurrentPosition(false);
        }, 1000);
    };

    const handleAddLocation = () => {
        if (selectedLocation) {
            console.log("Selected location:", selectedLocation); // Debug: verify the selected location is correct
            navigation.navigate("Home", { location: selectedLocation });    // Pass the selected location to the Home screen
        } else {
            console.warn('No location selected');
        }
    };


    // Function to refresh the current location
    const handleRefresh = useCallback(() => {
        if (defaultRegion.current) {
            setLoadingCurrentPosition(true);

            // Perform the dezoom to the default region with animation
            mapRef.current?.animateToRegion(defaultRegion.current, 1000);

            // Hide the loading after a short timeout to match the animation
            setTimeout(() => {
                setLoadingCurrentPosition(false);
            }, 1200);  // Wait a bit to sync the loader with the animation
        }
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Autocomplete
                    containerStyle={styles.autocompleteContainer}
                    data={filteredCities}
                    defaultValue={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        fetchLocationSuggestions(text);
                    }}
                    placeholder="Search for a city or a location..."
                    placeholderTextColor="rgba(0, 0, 0, 0.3)"
                    flatListProps={{
                        keyExtractor: (item) => item.name,
                        ListEmptyComponent: () => <Text style={styles.noResultText}>No results found</Text>,
                        renderItem: ({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCity(item)}>
                                <Text style={styles.itemText}>{item.name} ({item.distance?.toFixed(2)} km)</Text>
                            </TouchableOpacity>
                        ),
                    }}
                    style={styles.input}
                    autoCorrect={false}
                />
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                    <Ionicons name="refresh" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="#0000ff" />}

            <MapView
                ref={mapRef}
                style={styles.map}
                // Set the region to the current location or the selected location
                region={region || { latitude: 0, longitude: 0, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
                onRegionChangeComplete={setRegion}
            >
                {selectedLocation && (
                    <Marker
                        coordinate={{ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }}
                        title={selectedLocation.name}
                    />
                )}
            </MapView>

            <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
                <Text style={styles.addButtonText}>Add Location</Text>
            </TouchableOpacity>
        </View>
    );
};

export default AddLocation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
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
        color: '#999',
        padding: 10,
        textAlign: 'center',
    },
    input: {
        borderWidth: 0,
        borderRadius: 5,
        padding: 10,
    },
    refreshButton: {
        backgroundColor: '#6EC1E4',
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        marginLeft: 10,
    },
    itemText: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
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
        backgroundColor: '#6EC1E4',
        borderRadius: 10,
        alignItems: 'center',
        position: 'absolute',
        bottom: 20,
        width: '100%',
        left: 20,
        padding: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 25,
    },
});
