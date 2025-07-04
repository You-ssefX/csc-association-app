import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import BASE_URL from '../config';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window'); // Get screen dimensions for responsive image sizing

export default function GalerieScreen({ route }) {
  const { user } = route.params || {};
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // Stores the URL of the image to enlarge
  const [modalVisible, setModalVisible] = useState(false); // Controls modal visibility

  // Function to fetch photos from the backend
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user || !user._id) {
        setError('User ID not found. Cannot fetch photos.');
        setLoading(false);
        console.error('GalerieScreen: User ID check failed. Stopping fetch.');
        return;
      }

      const requestUrl = `${BASE_URL}/api/notifications/user/${user._id}/photos`;
      console.log(`GalerieScreen: Attempting to fetch from URL: ${requestUrl}`);

      const response = await fetch(requestUrl);
      const data = await response.json();

      if (response.ok) {
        // Flatten the array of image URLs from notifications
        const flattenedPhotos = data.flatMap(notification => {
          return Array.isArray(notification.imageUrl) ? notification.imageUrl : [];
        });
        setPhotos(flattenedPhotos);
        console.log('GalerieScreen: Fetched and flattened photos for state:', flattenedPhotos);
      } else {
        console.error('GalerieScreen: Error fetching photos from API (response not ok):', data);
        setError(data.error || 'Failed to fetch photos.');
      }
    } catch (err) {
      console.error('GalerieScreen: Network or parsing error during fetch:', err);
      setError('Network error. Could not load photos.');
    } finally {
      setLoading(false);
    }
  }, [user]); // Re-run effect if user changes

  // Effect to fetch photos on component mount or user change
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Function to open the full-screen image modal
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  // Function to close the full-screen image modal
  const closeImageModal = () => {
    setSelectedImage(null);
    setModalVisible(false);
  };

  // Display loading indicator
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Chargement des photos...</Text>
      </View>
    );
  }

  // Display error message
  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  // Display message if no photos are available
  if (photos.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noPhotosText}>Aucune photo disponible pour le moment.</Text>
      </View>
    );
  }

  // Main render function for the GalerieScreen
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🖼️ Galerie de Photos</Text>
      <FlatList
        data={photos}
        keyExtractor={(item, index) => `${item}_${index}`}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.photoWrapper}
            onPress={() => openImageModal(item)} // Open modal on photo press
          >
            <Image
              source={{ uri: `${BASE_URL}${item}` }}
              style={styles.photo}
              contentFit="cover"
              placeholder={'#cccccc'} // Placeholder for image loading
              onError={(e) => console.log('GalerieScreen: Error loading gallery image:', e.nativeEvent.error)}
            />
          </TouchableOpacity>
        )}
      />

      {/* Modal for full-screen image display with zoom */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal} // Allows closing with Android back button
      >
        <View style={styles.modalBackground}>
          <Pressable style={styles.closeButton} onPress={closeImageModal}>
            <Text style={styles.closeButtonText}>X</Text>
          </Pressable>
          {selectedImage && (
            <Image
              source={{ uri: `${BASE_URL}${selectedImage}` }}
              style={styles.fullScreenZoomableImage} // Style for full-screen zoomable image
              contentFit="contain" // Image is contained within the view
              enablePinchZoom // Enable pinch-to-zoom
              onError={(e) => console.log('GalerieScreen: Error loading full screen image in modal:', e.nativeEvent.error)}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#e3f2fd' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  noPhotosText: { // Added style for no photos available message
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#007bff', marginBottom: 20, textAlign: 'center' },
  photoWrapper: { // Wrapper for each photo in the grid
    width: '48%', // 48% for two columns with 1% margin on each side
    aspectRatio: 1, // Keep image square
    margin: '1%', // Margin between images
    borderRadius: 10,
    overflow: 'hidden', // Ensure rounded corners are respected
  },
  photo: { // Image style within the grid
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  modalBackground: { // Background for the full-screen modal
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)', // Semi-transparent black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenZoomableImage: { // Style for the full-screen zoomable image
    width: width, // Take full screen width
    height: height, // Take full screen height
    resizeMode: 'contain', // Image is contained, black bars might appear
  },
  closeButton: { // Close button for the modal
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure button is above the image
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
