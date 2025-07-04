// Importation du composant Video depuis Expo AV pour gérer les vidéos
import { Video } from 'expo-av';
// Importation de React et des hooks useEffect, useState, useCallback, useRef pour la gestion des états
import React, { useCallback, useEffect, useRef, useState } from 'react';
// Importation des composants de base de React Native pour l'interface
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Importation des images de fond et logo utilisées dans l'application
import bleu from "./assets/bleu.png";
import logo from './assets/logo.png';
// Importation de la configuration de l'API depuis un fichier séparé
import config from './config';

// Définition des groupes prédéfinis pour la sélection par l'utilisateur
const groups = [
  { label: 'Jeunesse', value: 'Jeunesse' },
  { label: 'Familles', value: 'Familles' },
  { label: 'Enfance', value: 'Enfance' },
  { label: 'Général', value: 'Generale' },
];

// Récupération des dimensions de l'écran pour un design responsive
const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
// Configuration du nombre de colonnes pour la grille de photos
const NUM_COLUMNS = 3;
// Calcul de la taille des images dans la grille avec un padding
const IMAGE_SIZE = (WINDOW_WIDTH - 20) / NUM_COLUMNS;
// Limite de longueur pour les messages avant troncature
const MAX_MESSAGE_LENGTH = 100;

export default function History() {
  // États pour gérer la logique de l'application
  const [activeGroup, setActiveGroup] = useState(null); // Groupe actuellement sélectionné
  const [activeTab, setActiveTab] = useState(null); // Onglet actif (null, notifications, photos)
  const [loading, setLoading] = useState(false); // Indicateur de chargement des données
  const [error, setError] = useState(null); // Message d'erreur en cas de problème
  const [textMessages, setTextMessages] = useState([]); // Liste des notifications texte
  const [photoMessages, setPhotoMessages] = useState([]); // Liste des photos/vidéos
  const [selectedContent, setSelectedContent] = useState({ content: null, allPhotos: [] }); // Contenu sélectionné (message ou média) avec liste complète
  const [isMediaView, setIsMediaView] = useState(false); // Indique si la modale affiche un média
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0); // Index de la photo actuelle dans la liste
  const flatListRef = useRef(null); // Référence pour la FlatList de la visionneuse

  // Fonction pour normaliser les chaînes et gérer les accents
  const normalizeString = (str) =>
    str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';

  // Effet pour charger les données lorsque le groupe actif change
  useEffect(() => {
  if (!activeGroup) return;

  const controller = new AbortController();
  setLoading(true);
  setError(null);
  setActiveTab(null);

  const normalizedGroup = normalizeString(activeGroup);
  const baseUrl = config.BASE_URL?.endsWith('/') ? config.BASE_URL.slice(0, -1) : config.BASE_URL;

  if (!baseUrl) {
    setError('Erreur : URL de base non configurée');
    setLoading(false);
    return;
  }

  let fetchNotifications, fetchPhotos;

  if (normalizedGroup === 'general' || normalizedGroup === 'generale') {
    const groupesCibles = ['Enfance', 'Jeunesse', 'Familles'];

    fetchNotifications = fetch(`${baseUrl}/api/notifications/history`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur API notifications : ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse API invalide : tableau attendu');
        return data.map(item => ({
          ...item,
          photo: Array.isArray(item.imageUrl) ? item.imageUrl : (item.imageUrl ? [item.imageUrl] : []),
        })).filter((item) => item.targetGroups?.some((g) => groupesCibles.includes(g)));
      });

    fetchPhotos = fetch(`${baseUrl}/api/notifications/photos`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur API photos : ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse API invalide : tableau attendu');
        return data.filter((item) => item.targetGroups?.some((g) => groupesCibles.includes(g)));
      });
  } else {
    fetchNotifications = fetch(`${baseUrl}/api/notifications/group/${activeGroup}/history`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur API notifications : ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse API invalide : tableau attendu');
        return data.map(item => ({
          ...item,
          photo: Array.isArray(item.imageUrl)
            ? item.imageUrl.map(ph => ph.startsWith('http') ? ph : `${baseUrl}/${ph.replace(/\\/g, '/').replace(/^\/+/, '')}`)
            : item.imageUrl
            ? [`${baseUrl}/${item.imageUrl.replace(/\\/g, '/').replace(/^\/+/, '')}`]
            : [],
        }));
      });

    fetchPhotos = fetch(`${baseUrl}/api/notifications/group/${activeGroup}/photos`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur API photos : ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Réponse API invalide : tableau attendu');
        return data;
      });
  }

  Promise.all([fetchNotifications, fetchPhotos])
    .then(([notificationsData, photosData]) => {
      setTextMessages(notificationsData);
      const combined = photosData.flatMap((item) => {
        const rawPhotos = Array.isArray(item.photo)
          ? item.photo
          : Array.isArray(item.imageUrl)
          ? item.imageUrl
          : typeof item.imageUrl === 'string'
          ? [item.imageUrl]
          : [];
        const photos = rawPhotos.filter((ph) => typeof ph === 'string' && ph.trim() !== '');
        return photos.map((ph) => ({
          ...item,
          photo: ph.startsWith('http')
            ? ph
            : `${baseUrl}/${ph.replace(/\\/g, '/').replace(/^\/+/, '')}`,
          sentAt: item.sentAt || new Date().toISOString(),
        }));
      });
      setPhotoMessages(combined);
    })
    .catch((err) => {
      if (err.name === 'AbortError') return;
      setError('Erreur lors du chargement des données');
    })
    .finally(() => setLoading(false));

  return () => controller.abort();
}, [activeGroup]);

  // Fonction pour formater la date en format lisible (jj/mm/aaaa hh:mm)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction pour rendre un média (image ou vidéo) avec gestion des erreurs
  const renderMedia = (uri, key, isThumbnail = false) => {
    if (!uri || typeof uri !== 'string' || !uri.startsWith('http')) {
      return null;
    }
    return uri.endsWith('.mp4') ? (
      <Video
        key={key}
        source={{ uri }}
        style={isThumbnail ? styles.thumbnail : styles.fullScreenMedia}
        useNativeControls={!isThumbnail}
        resizeMode="contain"
        isLooping={!isThumbnail}
        onError={(err) => console.log("Video error:", err)}
      />
    ) : (
      <Image
        key={key}
        source={{ uri }}
        style={isThumbnail ? styles.thumbnail : styles.fullScreenMedia}
        resizeMode="cover"
        onError={(err) => console.log("Image error:", err)}
      />
    );
  };

  // Fonction pour gérer la sélection de contenu (message ou média) avec index
  const handleSelectContent = useCallback((content, isMedia = false, allPhotos = [], initialIndex = 0) => {
    console.log("Selecting content:", content, "isMedia:", isMedia, "initialIndex:", initialIndex, "allPhotos:", allPhotos);
    const validPhotos = Array.isArray(allPhotos) ? allPhotos.filter(p => typeof p === 'string' && p.trim() !== '') : [];
    const validIndex = Math.min(Math.max(initialIndex, 0), validPhotos.length - 1);
    setSelectedContent({ content, allPhotos: validPhotos });
    setIsMediaView(isMedia);
    setCurrentPhotoIndex(validIndex);
    if (isMedia && flatListRef.current && validPhotos.length > 0) {
      flatListRef.current.scrollToIndex({ index: validIndex, animated: true });
    }
  }, []);

  // Rendu d'une notification avec titre, message tronqué et photos déroulantes
  const renderNotification = ({ item: msg, index }) => {
    const truncatedMessage = msg.message && msg.message.length > MAX_MESSAGE_LENGTH
      ? `${msg.message.substring(0, MAX_MESSAGE_LENGTH)}... (voir plus...)`
      : msg.message;
    
    return (
      <TouchableOpacity
        key={index}
        style={styles.messageBox}
        onPress={() => handleSelectContent(msg, false, msg.photo || [])} // Ouvre la visionneuse avec le message
      >
        <Text style={styles.date}>{formatDate(msg.sentAt || new Date().toISOString())}</Text>
        <Text style={styles.messageTitle}>{msg.title || 'Sans titre'}</Text>
        <Text style={styles.message}>{truncatedMessage}</Text>
        {msg.photo && msg.photo.length > 0 && (
          <FlatList
            data={msg.photo}
            keyExtractor={(photo, photoIndex) => `${index}-${photoIndex}`}
            renderItem={({ item: photo, index: photoIndex }) => (
              <TouchableOpacity
                style={styles.photoThumbnailContainer}
                onPress={() => handleSelectContent(photo, true, msg.photo || [], photoIndex)} // Ouvre la visionneuse avec le média
              >
                {renderMedia(photo, `${index}-${photo}`, true)}
              </TouchableOpacity>
            )}
            horizontal={true} // Affichage horizontal des photos
            showsHorizontalScrollIndicator={false} // Désactive la barre de défilement
            contentContainerStyle={styles.photoList}
          />
        )}
      </TouchableOpacity>
    );
  };

  // Rendu de la liste des notifications
  const renderNotifications = () => (
    <FlatList
      data={textMessages}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderNotification}
      ListEmptyComponent={<Text style={styles.subtitle}>Aucune notification.</Text>}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );

  // Rendu de la grille de photos
  const renderPhotoGrid = () => (
    <FlatList
      data={photoMessages}
      keyExtractor={(_, index) => index.toString()}
      numColumns={NUM_COLUMNS}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.thumbnailContainer}
          onPress={() => handleSelectContent(item.photo, true, photoMessages.map(p => p.photo).flat().filter(p => typeof p === 'string' && p.trim() !== ''), index)} // Ouvre la visionneuse avec le média
        >
          {renderMedia(item.photo, index, true)}
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.subtitle}>Aucune photo ou vidéo.</Text>}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );

  // Rendu de la visionneuse unique pour message ou média
  const renderViewer = () => {
    const { content, allPhotos } = selectedContent;
    const photosToDisplay = isMediaView ? allPhotos : (content?.photo || []);

    const renderMediaItem = ({ item: photo }) => (
      <View style={styles.fullScreenMediaContainer}>
        {renderMedia(photo, 'full-screen-media')}
      </View>
    );

    return (
      <Modal
        visible={!!content}
        transparent={false}
        onRequestClose={() => {
          console.log("Closing viewer");
          setSelectedContent({ content: null, allPhotos: [] });
          setIsMediaView(false);
          setCurrentPhotoIndex(0);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {
            console.log("Close button pressed");
            setSelectedContent({ content: null, allPhotos: [] });
            setIsMediaView(false);
            setCurrentPhotoIndex(0);
          }}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {isMediaView && allPhotos.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={allPhotos}
              horizontal
              pagingEnabled
              snapToInterval={WINDOW_WIDTH}
              initialScrollIndex={currentPhotoIndex}
              getItemLayout={(data, index) => ({
                length: WINDOW_WIDTH,
                offset: WINDOW_WIDTH * index,
                index,
              })}
              renderItem={renderMediaItem}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              onScrollToIndexFailed={(info) => {
                console.log("Scroll to index failed:", info);
                const validIndex = Math.min(info.index, allPhotos.length - 1);
                setCurrentPhotoIndex(validIndex);
                flatListRef.current?.scrollToIndex({ index: validIndex, animated: true });
              }}
              style={styles.mediaFlatList}
            />
          ) : content ? (
            <ScrollView style={styles.messageDetailContainer}>
              <Text style={styles.messageTitle}>{content.title || 'Sans titre'}</Text>
              <Text style={styles.message}>{content.message}</Text>
              {content.photo && content.photo.length > 0 && (
                <FlatList
                  data={content.photo}
                  keyExtractor={(photo, photoIndex) => `msg-${photoIndex}`}
                  renderItem={({ item: photo, index: photoIndex }) => (
                    <TouchableOpacity
                      style={styles.photoThumbnailContainer}
                      onPress={() => handleSelectContent(photo, true, content.photo, photoIndex)} // Ouvre le média dans la même modale
                    >
                      {renderMedia(photo, `msg-${photo}`, true)}
                    </TouchableOpacity>
                  )}
                  horizontal={true} // Affichage horizontal des photos
                  showsHorizontalScrollIndicator={false} // Désactive la barre de défilement
                  contentContainerStyle={styles.photoList}
                />
              )}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    );
  };

  // Affichage pendant le chargement des données
  if (loading) {
    return (
      <ImageBackground source={bleu} style={styles.backgroundImage}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0077cc" />
        </View>
      </ImageBackground>
    );
  }

  // Affichage initial pour sélectionner un groupe
    if (!activeGroup) {
      return (
        <ImageBackground source={bleu} style={styles.backgroundImage}>
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>📜 Historique</Text>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.value}
                onPress={() => setActiveGroup(group.value)}
                style={styles.groupButton}
                accessibilityLabel={`Sélectionner le groupe ${group.label}`}
              >
                <Text style={styles.groupButtonText}>📁 {group.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ImageBackground>
      );
    }
  // Affichage principal avec onglets et contenu
  return (
    <ImageBackground source={bleu} style={styles.backgroundImage}>
      <View style={styles.mainContainer}>
        <Text style={styles.subtitle}>🧑‍🤝‍🧑 Groupe sélectionné : {activeGroup}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Conteneur pour les boutons de retour */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            style={[styles.customButton, styles.backButton]}
            onPress={() => {
              setActiveGroup(null);
              setActiveTab(null);
            }}
          >
            <Text style={styles.Button}>⬅️ Retour aux groupes</Text>
          </TouchableOpacity>
          {activeTab && (
            <TouchableOpacity
              style={[styles.customButton, styles.backButton]}
              onPress={() => setActiveTab(null)}
            >
              <Text style={styles.customButtonTex}>⬅️ Retour</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Onglets pour naviguer entre notifications et photos */}
        {activeTab === null && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.customButton, styles.tabButton, activeTab === 'notifications' && styles.activeTab]}
              onPress={() => setActiveTab('notifications')}
            >
              <Text style={styles.customButtonText}>🔔 Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customButton, styles.tabButton, activeTab === 'photos' && styles.activeTab]}
              onPress={() => setActiveTab('photos')}
            >
              <Text style={styles.customButtonText}>🖼️ Photos</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenu affiché selon l'onglet actif */}
        <View style={styles.contentContainer}>
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'photos' && renderPhotoGrid()}
        </View>

        {/* Visionneuse unique */}
        {renderViewer()}
      </View>
    </ImageBackground>
  );
}

// Définition des styles pour l'application
const styles = StyleSheet.create({
  // Style pour l'image de fond qui couvre tout l'écran
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  // Style pour le conteneur principal avec opacité légère
   container: {
    padding: 15,
    minHeight: "100%",
    backgroundColor: 'rgba(214, 234, 255, 0.7)', // Opacité légère pour lisibilité
  },

  // Style pour le conteneur principal alternatif
  mainContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "rgba(214, 234, 255, 0.8)",
  },

  // Style pour le conteneur de chargement centré
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "rgba(214, 234, 255, 0.8)",
  },

  // Style pour le titre principal
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#1a2b4c',
    marginBottom: 60,
    textAlign: 'center',
  },

  // Style pour le logo centré avec coins arrondis
  logo: {
    width: 210,
    height: 150,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },

 
subtitle: { // Style pour le sous-titre
  fontSize: 22,
  fontWeight: "600",
  color: "#2a4365",
  marginBottom: 15,
  textAlign: "center",
},

  // Style pour le conteneur des onglets
  tabContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },

  // Style pour les boutons d'onglet
  tabButton: {
    width: '80%',
    alignItems: 'center',
  },

  // Style pour les boîtes de message
  messageBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 7,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },

  // Style pour la date dans les messages
  date: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
    textAlign: 'right',
  },

  // Style pour le titre des messages
  messageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  // Style pour le contenu des messages
  message: {
    fontSize: 14,
    color: '#333',
  },

  // Style pour les conteneurs de miniatures
  thumbnailContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 1,
  },

  // Style pour les miniatures d'images/vidéos
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },

  // Style pour le conteneur de la modale
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Style pour les médias en plein écran
  fullScreenMediaContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * 1.5,
  },

  fullScreenMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },

  // Style pour la FlatList des médias
  mediaFlatList: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * 1.5,
  },

  // Style pour le bouton de fermeture
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  // Style pour le texte du bouton de fermeture
  closeButtonText: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },

  // Style pour les boutons personnalisés
  customButton: {
    backgroundColor: 'rgb(243, 215, 133)',
    paddingVertical: 90,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#aaa",
    shadowColor: "#000",
    padding: 10,
    justifyContent: "center",
  },

  // Style pour le texte dans les boutons retour aux groupes
  Button: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: '600',
  },
  // Style pour le texte dans les boutons personnalisés
  customButtonText: {
    fontSize: 20,
    color: "#2c3e50",
    fontWeight: '600',
  },

  // Style pour les boutons de retour
  backButton: {
    backgroundColor: '#cbd5e1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },

  // Style pour le conteneur des boutons de retour
  backButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  // Style pour l'onglet actif
  activeTab: {
    backgroundColor: '#3377cc',
  },

  // Style pour les messages d'erreur
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },

  // Style pour le conteneur de contenu principal
  contentContainer: {
    flex: 1,
  },

  // Style pour le conteneur détaillé d'un message dans la modale
  messageDetailContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 80,
    maxHeight: WINDOW_HEIGHT * 0.8,
    width: '90%',
  },

  // Style pour les conteneurs de miniatures dans les modales
  photoThumbnailContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: 5,
    justifyContent: 'center',
  },

  // Style pour la liste horizontale des photos
  photoList: {
    paddingVertical: 10,
  },

  // Style pour les boutons de groupe
  groupButton: { // Style pour les boutons de groupe
  backgroundColor: 'rgb(242,201,76)', // Opacité légère pour lisibilité
  paddingVertical: 19,
  borderRadius: 16,
  marginBottom: 7,
  borderWidth: 2,
  borderColor: "#aaa",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 4,
},

  // Style pour le texte dans les boutons de groupe
  groupButtonText: {
    color: "#2c3e50",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});