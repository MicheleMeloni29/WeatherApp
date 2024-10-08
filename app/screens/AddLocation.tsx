import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Autocomplete from 'react-native-autocomplete-input';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Definisci i tipi di navigazione e route per questa schermata
type RootStackParamList = {
    Home: { location: any };
    AddLocationScreen: undefined;
};

type AddLocationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddLocationScreen'>;
type AddLocationScreenRouteProp = RouteProp<RootStackParamList, 'AddLocationScreen'>;

type Props = {
    navigation: AddLocationScreenNavigationProp;
    route: AddLocationScreenRouteProp;
};

export default function AddLocationScreen({ navigation }: Props) {
    const [query, setQuery] = useState('');
    const [filteredCities, setFilteredCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const mapRef = useRef<MapView>(null);
    const currentLocation = useRef<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission to access location was denied');
            return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        });
        currentLocation.current = { latitude, longitude };
    };

    const fetchLocationSuggestions = async (text: string) => {
        if (text.length < 1) {
            setFilteredCities([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.locationiq.com/v1/autocomplete.php?key=pk.50885526f1e3429619457922e2499771&q=${text}&limit=5&dedupe=1&format=json`
            );
            const data = await response.json();
            const suggestions = data.map((location) => ({
                name: location.display_name,
                latitude: parseFloat(location.lat),
                longitude: parseFloat(location.lon),
            }));

            if (currentLocation.current) {
                const sortedSuggestions = sortLocationsByDistance(suggestions);
                setFilteredCities(sortedSuggestions);
            } else {
                setFilteredCities(suggestions);
            }
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const sortLocationsByDistance = (locations) => {
        return locations
            .map((city) => {
                if (currentLocation.current) {
                    const distance = calculateDistance(
                        currentLocation.current.latitude,
                        currentLocation.current.longitude,
                        city.latitude,
                        city.longitude
                    );
                    return { ...city, distance };
                }
                return city;
            })
            .sort((a, b) => a.distance - b.distance);
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Raggio della Terra in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distanza in km
    };

    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const handleSelectCity = (city) => {
        setQuery(city.name);
        setSelectedLocation(city);
        setFilteredCities([]);

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: city.latitude,
                longitude: city.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    };

    const handleAddLocation = () => {
        if (selectedLocation) {
            navigation.navigate('Home', { location: selectedLocation });
        }
    };

    const handleRefresh = useCallback(async () => {
        const location = await Location.getCurrentPositionAsync({});
        const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        };
        setRegion(newRegion);

        if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 1000);
        }
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Autocomplete
                    containerStyle={styles.autocompleteContainer}
                    data={filteredCities.length === 0 && query ? [] : filteredCities}
                    defaultValue={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        fetchLocationSuggestions(text);
                    }}
                    placeholder="Search for a city..."
                    flatListProps={{
                        keyExtractor: (item) => item.name,
                        renderItem: ({ item }) => (
                            <TouchableOpacity onPress={() => handleSelectCity(item)}>
                                <Text style={styles.itemText}>{item.name} ({item.distance?.toFixed(2)} km)</Text>
                            </TouchableOpacity>
                        ),
                        maxToRenderPerBatch: 3,
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
                region={region}
                onRegionChangeComplete={setRegion}
            >
                {selectedLocation && (
                    <Marker
                        coordinate={{
                            latitude: selectedLocation.latitude,
                            longitude: selectedLocation.longitude,
                        }}
                        title={selectedLocation.name}
                    />
                )}
            </MapView>

            <TouchableOpacity style={styles.addButton} onPress={handleAddLocation}>
                <Text style={styles.addButtonText}>Add Location</Text>
            </TouchableOpacity>
        </View>
    );
}

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
        zIndex: 1,
    },
    autocompleteContainer: {
        flex: 1,
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#ff0f0f0',
        flex: 1,
    },
    refreshButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10, // Spazio tra input e bottone refresh
    },
    itemText: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    map: {
        flex: 1,
        width: '100%',
        marginTop: 10,
    },
    addButton: {
        padding: 15,
        backgroundColor: '#007BFF',
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});
