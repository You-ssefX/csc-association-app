import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Pressable, Dimensions } from 'react-native';
import BASE_URL from '../config';
import { Image } from 'expo-image';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HistoriqueScreen({ route }) {
  const { user } = route.params || {};
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [zoomModalVisible, setZoomModalVisible] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      try {
        if (!user || !user._id || !user.group) {
          setLoadingNotifications(false);
          return;
        }
        const response = await fetch(`${BASE_URL}/api/notifications/group/${user.group}/history?userId=${user._id}`);
        const data = await response.json();
        if (response.ok) {
          setNotifications(data);
        } else {
          Alert.alert('Erreur', data.error || 'Impossible de charger les notifications.');
        }
      } catch (error) {
        Alert.alert('Erreur réseau', 'Vérifiez votre connexion pour l\'historique.');
      } finally {
        setLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, [user]);

  // Ouvre la modale de détails (sauf si clic sur l'image)
  const openDetailsModal = (notif) => {
    setSelectedNotif(notif);
    setDetailsModalVisible(true);
  };
  const closeDetailsModal = () => {
    setSelectedNotif(null);
    setDetailsModalVisible(false);
  };
  // Ouvre la modale de zoom image
  const openZoomModal = (imageUrl) => {
    setZoomImageUrl(imageUrl);
    setZoomModalVisible(true);
  };
  const closeZoomModal = () => {
    setZoomImageUrl(null);
    setZoomModalVisible(false);
  };

  const respondToNotification = async (notificationId, response) => {
    try {
      const res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, response }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(notifications.map(notif =>
          notif._id === notificationId ? { ...notif, userResponse: response } : notif
        ));
      } else {
        Alert.alert('Erreur', 'Échec de la réponse.');
      }
    } catch (error) {
      Alert.alert('Erreur réseau', 'Vérifiez votre connexion pour répondre.');
    }
  };

  if (loadingNotifications) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#ff5733" />
        <Text style={styles.loadingText}>Chargement de l'historique...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noNotificationsText}>Aucune notification disponible pour le moment.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Historique & Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const imageUrl = `${BASE_URL}${Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl}`;
          return (
            <View style={styles.notificationItem}>
              {/* Image clickable for zoom modal */}
              {item.imageUrl && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setZoomImageUrl(imageUrl);
                    setZoomModalVisible(true);
                  }}
                  style={{ zIndex: 2 }}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.notificationImage}
                    contentFit="cover"
                    placeholder={require('../assets/images/Logo.png')}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              )}
              {/* Rest of card clickable for details modal */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openDetailsModal(item)}
                style={{ flex: 1, marginTop: item.imageUrl ? -40 : 0, paddingTop: item.imageUrl ? 40 : 0 }}
              >
                <View>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.sentAtText}>
                    Envoyé le : {new Date(item.sentAt).toLocaleString('fr-FR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {item.userResponse && (
                    <Text
                      style={[
                        styles.userResponse,
                        { color: item.userResponse === 'available' ? '#28a745' : '#dc3545' },
                      ]}
                    >
                      Votre réponse : {item.userResponse === 'available' ? 'Disponible' : 'Non disponible'}
                    </Text>
                  )}
                  {item.isInteractive && !item.userResponse && (
                    <View style={styles.responseButtons}>
                      <TouchableOpacity
                        style={[styles.responseButton, { backgroundColor: '#28a745' }]}
                        onPress={() => respondToNotification(item._id, 'available')}
                      >
                        <Text style={styles.responseText}>✅ Disponible</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.responseButton, { backgroundColor: '#dc3545' }]}
                        onPress={() => respondToNotification(item._id, 'unavailable')}
                      >
                        <Text style={styles.responseText}>❌ Non disponible</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      {/* Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.fastModalBackground}>
          <View style={styles.fastModalContent}>
            <Pressable style={styles.modalCloseButton} onPress={closeDetailsModal}>
              <Text style={styles.modalCloseButtonText}>X</Text>
            </Pressable>
            {selectedNotif && (
              <>
                <Text style={styles.modalTitle}>{selectedNotif.title}</Text>
                <Text style={styles.modalMessage}>{selectedNotif.message}</Text>
                {selectedNotif.imageUrl && (
                  <Image
                    source={{ uri: `${BASE_URL}${Array.isArray(selectedNotif.imageUrl) ? selectedNotif.imageUrl[0] : selectedNotif.imageUrl}` }}
                    style={styles.fastModalImage}
                    contentFit="cover"
                    placeholder={require('../assets/images/Logo.png')}
                    cachePolicy="memory-disk"
                  />
                )}
                <Text style={styles.modalDate}>
                  Envoyé le : {new Date(selectedNotif.sentAt).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {selectedNotif.userResponse && (
                  <Text
                    style={[
                      styles.userResponse,
                      { color: selectedNotif.userResponse === 'available' ? '#28a745' : '#dc3545' },
                    ]}
                  >
                    Votre réponse : {selectedNotif.userResponse === 'available' ? 'Disponible' : 'Non disponible'}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Zoom Image Modal */}
      <Modal
        visible={zoomModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeZoomModal}
      >
        <View style={styles.fullscreenZoomBackground}>
          <Pressable
            style={styles.zoomCloseButton}
            onPress={closeZoomModal}
          >
            <Text style={styles.zoomCloseButtonText}>X</Text>
          </Pressable>
          {zoomImageUrl && (
            <Image
              source={{ uri: zoomImageUrl }}
              style={styles.fullscreenZoomImage}
              contentFit="contain"
              enablePinchZoom
              placeholder={require('../assets/images/Logo.png')}
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fef5e7' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef5e7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff5733',
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ff5733', marginBottom: 20, textAlign: 'center' },
  notificationItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  notificationTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  notificationMessage: { fontSize: 16, color: '#666', marginVertical: 5 },
  notificationImage: { width: '100%', height: 150, borderRadius: 10, marginVertical: 10 },
  sentAtText: { fontSize: 12, color: '#999', marginTop: 5 },
  responseButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  responseButton: { padding: 10, borderRadius: 5, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  responseText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  userResponse: { fontSize: 14, color: '#28a745', marginTop: 10, fontWeight: 'bold', textAlign: 'center' },
  // Fast, large, centered modal for notification details
  fastModalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fastModalContent: {
    width: SCREEN_WIDTH > 500 ? 500 : '95%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fastModalImage: { width: 320, height: 320, borderRadius: 10, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#007bff', textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#333', marginBottom: 15, textAlign: 'center' },
  modalDate: { fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' },
  fullscreenZoomBackground: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenZoomImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
  },
  zoomCloseButtonText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});