import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/Authprovider';
import { useTheme } from '../../hooks/ThemeProvider';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

function SettingsScreen() {
    const { logout } = useAuth();
    const { theme, isDarkMode, setDarkMode } = useTheme();
    const auth = getAuth();
    const user = auth.currentUser;

    // Settings state
    const [notifications, setNotifications] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // Load settings from AsyncStorage
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('userSettings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                setNotifications(parsedSettings.notifications ?? true);
                setLocationTracking(parsedSettings.locationTracking ?? true);
                setAutoRefresh(parsedSettings.autoRefresh ?? true);
                // Dark mode is now handled by ThemeProvider
            }

            // Load profile image separately
            const savedProfileImage = await AsyncStorage.getItem('profileImage');
            if (savedProfileImage) {
                setProfileImage(savedProfileImage);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async (newSettings: any) => {
        try {
            await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const handleTemperatureUnitChange = async () => {
        const settings = {
            notifications,
            locationTracking,
            autoRefresh
        };
        await saveSettings(settings);
    };

    const handleToggleSetting = async (setting: string, value: boolean) => {
        const newSettings = {
            notifications,
            locationTracking,
            autoRefresh,
            [setting]: value
        };

        switch (setting) {
            case 'notifications':
                setNotifications(value);
                break;
            case 'locationTracking':
                setLocationTracking(value);
                break;
            case 'autoRefresh':
                setAutoRefresh(value);
                break;
            case 'darkMode':
                setDarkMode(value);
                return; // Don't save to regular settings, handled by ThemeProvider
        }

        await saveSettings(newSettings);
    };

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const handleChangeProfileImage = async () => {
        setShowProfileDropdown(false);

        // Request permission to access media library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'Sorry, we need camera roll permissions to select a profile image.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Show options for selecting image
        Alert.alert(
            'Select Profile Image',
            'Choose how you want to select your profile image:',
            [
                {
                    text: 'Camera',
                    onPress: () => openImagePicker('camera'),
                },
                {
                    text: 'Photo Library',
                    onPress: () => openImagePicker('library'),
                },
                {
                    text: 'Remove Photo',
                    onPress: () => removeProfileImage(),
                    style: 'destructive',
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const openImagePicker = async (source: 'camera' | 'library') => {
        try {
            let result;

            if (source === 'camera') {
                // Request camera permission
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraPermission.status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera permission is required to take photos.');
                    return;
                }

                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1], // Square aspect ratio
                    quality: 0.8,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1], // Square aspect ratio
                    quality: 0.8,
                });
            }

            if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                setProfileImage(imageUri);

                // Save the image URI to AsyncStorage
                await AsyncStorage.setItem('profileImage', imageUri);

                Alert.alert('Success', 'Profile image updated successfully!');
            }
        } catch (error) {
            console.error('Error selecting image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    const removeProfileImage = async () => {
        try {
            setProfileImage(null);
            await AsyncStorage.removeItem('profileImage');
            Alert.alert('Success', 'Profile image removed successfully!');
        } catch (error) {
            console.error('Error removing profile image:', error);
            Alert.alert('Error', 'Failed to remove profile image.');
        }
    };

    const handleChangePassword = () => {
        setShowProfileDropdown(false);
        Alert.alert('Change Password', 'Password change feature coming soon!');
    };

    const toggleProfileDropdown = () => {
        setShowProfileDropdown(!showProfileDropdown);
    };

    const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }: any) => (
        <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.borderSecondary }]} onPress={onPress}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon} size={24} color={theme.primary} style={styles.settingIcon} />
                <View>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                    {subtitle && <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
                </View>
            </View>
            {rightComponent}
        </TouchableOpacity>
    );

    const ToggleSwitch = ({ value, onValueChange }: any) => (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: theme.textSecondary, true: theme.primary }}
            thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* User Profile Section */}
            <View style={[styles.profileSection, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
                <TouchableOpacity style={styles.profileInfo} onPress={toggleProfileDropdown}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={
                                profileImage
                                    ? { uri: profileImage }
                                    : require('../../assets/images/logo.png')
                            }
                            style={styles.profileImage}
                        />
                        {!profileImage && (
                            <View style={styles.profileImageOverlay}>
                                <Ionicons name="person" size={24} color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={styles.profileTextContainer}>
                        <Text style={[styles.profileName, { color: theme.text }]}>
                            {user?.email?.split('@')[0] || 'User'}
                        </Text>
                        <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email || 'No email'}</Text>
                    </View>
                    <Ionicons
                        name={showProfileDropdown ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={theme.primary}
                    />
                </TouchableOpacity>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                    <View style={[styles.profileDropdown, { backgroundColor: theme.sectionBackground, borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: theme.borderSecondary }]} onPress={handleChangeProfileImage}>
                            <Ionicons name="camera-outline" size={20} color={theme.primary} />
                            <Text style={[styles.dropdownText, { color: theme.text }]}>Change Profile Image</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: theme.borderSecondary }]} onPress={handleChangePassword}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                            <Text style={[styles.dropdownText, { color: theme.text }]}>Change Password</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Weather Settings */}
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, backgroundColor: theme.sectionBackground, borderBottomColor: theme.border }]}>Weather Settings</Text>

                <SettingItem
                    icon="location-outline"
                    title="Location Tracking"
                    subtitle="Allow app to access your location"
                    rightComponent={
                        <ToggleSwitch
                            value={locationTracking}
                            onValueChange={(value: boolean) => handleToggleSetting('locationTracking', value)}
                        />
                    }
                />

                <SettingItem
                    icon="refresh-outline"
                    title="Auto Refresh"
                    subtitle="Automatically update weather data"
                    rightComponent={
                        <ToggleSwitch
                            value={autoRefresh}
                            onValueChange={(value: boolean) => handleToggleSetting('autoRefresh', value)}
                        />
                    }
                />
            </View>

            {/* App Settings */}
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, backgroundColor: theme.sectionBackground, borderBottomColor: theme.border }]}>App Settings</Text>

                <SettingItem
                    icon="notifications-outline"
                    title="Notifications"
                    subtitle="Receive weather alerts and updates"
                    rightComponent={
                        <ToggleSwitch
                            value={notifications}
                            onValueChange={(value: boolean) => handleToggleSetting('notifications', value)}
                        />
                    }
                />

                <SettingItem
                    icon="moon-outline"
                    title="Dark Mode"
                    subtitle="Switch to dark theme"
                    rightComponent={
                        <ToggleSwitch
                            value={isDarkMode}
                            onValueChange={(value: boolean) => handleToggleSetting('darkMode', value)}
                        />
                    }
                />
            </View>

            {/* Account Section */}
            <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.sectionTitle, { color: theme.text, backgroundColor: theme.sectionBackground, borderBottomColor: theme.border }]}>Account</Text>

                <SettingItem
                    icon="log-out-outline"
                    title="Logout"
                    subtitle="Sign out of your account"
                    onPress={handleLogout}
                    rightComponent={
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    }
                />
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
                <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>WeatherApp v1.0.0</Text>
                <Text style={[styles.appInfoText, { color: theme.textSecondary }]}>© 2025 Weather Forecast</Text>
            </View>
        </ScrollView>
    );
}

export default SettingsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileSection: {
        padding: 20,
        marginBottom: 20,
        borderBottomWidth: 1,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 15,
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6EC1E4',
        resizeMode: 'cover',
    },
    profileImageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(110, 193, 228, 0.8)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
    },
    profileTextContainer: {
        flex: 1,
    },
    profileDropdown: {
        borderTopWidth: 1,
        paddingTop: 10,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    dropdownText: {
        fontSize: 16,
        marginLeft: 12,
        fontWeight: '500',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 15,
        width: 24,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 13,
    },
    settingValue: {
        fontSize: 16,
        color: '#6EC1E4',
        fontWeight: '600',
    },
    appInfo: {
        padding: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    appInfoText: {
        fontSize: 12,
        marginBottom: 5,
    },
});