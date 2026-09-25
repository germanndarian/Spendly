import { registerRootComponent } from 'expo';

import App from './App';

// Startpunkt für Expo: registerRootComponent meldet unsere App beim Handy an.
// Egal ob die App in Expo Go oder als eigener Build läuft – sie startet
// immer mit der Komponente <App /> aus App.js.
registerRootComponent(App);
