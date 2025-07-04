// On importe la fonction registerRootComponent depuis Expo
// Cette fonction sert à enregistrer le composant principal de l'application
import { registerRootComponent } from "expo";

// On importe notre composant App principal, celui qui contient toute l'application React Native
import App from './App';

// On enregistre le composant App comme point d'entrée de l'application
// Expo se charge d'initialiser tout ce qu'il faut (le système natif, la navigation, etc.)
// et de lancer ce composant principal pour afficher l'app sur le téléphone ou émulateur
registerRootComponent(App);
