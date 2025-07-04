// Import du conteneur de navigation qui englobe toute la navigation de l'app
import { NavigationContainer } from "@react-navigation/native";

// Import de la fonction qui crée un gestionnaire de navigation en "pile" native (stack navigator)
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import de React (obligatoire pour utiliser JSX)
import React from "react";

// Import des composants/pages que l'on veut afficher dans la navigation
import Envoyer from "./app/src/Component/envoyer.jsx";
import History from "./app/src/Component/history";
import User from "./app/src/Component/user";
import Admin from "./app/src/Pages/admin";
import Login from "./app/src/Pages/login";

// Création du stack navigator : c'est un gestionnaire qui organise les écrans en pile
const Stack = createNativeStackNavigator();

// Fonction principale qui retourne le composant racine de l'application
export default function App() {
  return (
    // NavigationContainer englobe toute la navigation, obligatoire pour que ça fonctionne
    <NavigationContainer>

      {/* Stack.Navigator contient la liste de tous les écrans dans l'app */}
      <Stack.Navigator initialRouteName="Login">
        {/* Ecran "Admin" : affichage du composant Admin, sans barre de titre */}
        <Stack.Screen
          name="Admin" // nom utilisé pour naviguer vers cet écran
          component={Admin} // composant affiché quand on va sur cette page
          options={{ headerShown: false }} // cache la barre de titre en haut
        />

        {/* Ecran "Login" : page de connexion, affichée au lancement de l'app */}
        <Stack.Screen
          name="Login" // nom de l'écran Login
          component={Login} // composant à afficher
          options={{ headerShown: false }} // on cache la barre de titre ici aussi
        />

        {/* Ecran "Envoyer" : page pour envoyer des messages ou données */}
        <Stack.Screen
          name="Envoyer" // nom de l'écran
          component={Envoyer} // composant correspondant
          options={{ title: "Envoyer" }} // titre affiché dans la barre de navigation
        />

        {/* Ecran "Historique" : page qui affiche l'historique */}
        <Stack.Screen
          name="Historique" // nom de l'écran
          component={History} // composant correspondant
          options={{ title: "Historique" }} // titre affiché dans la barre de navigation
        />

        {/* Ecran "Utilisateurs" : page pour afficher les utilisateurs */}
        <Stack.Screen
          name="Utilisateurs" // nom de l'écran
          component={User} // composant correspondant
          options={{ title: "Utilisateurs" }} // titre affiché dans la barre de navigation
        />
      </Stack.Navigator>

    </NavigationContainer>
  );
}
