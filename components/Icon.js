// Einheitliche Icons: Feather (feine Outline-Icons) als Standard.
// Face ID und Fingerabdruck gibt es bei Feather nicht – dafür nehmen wir
// MaterialCommunityIcons (family="mci").
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function Icon({ name, size = 20, color, family = 'feather' }) {
  // family='mci' für Face-ID- und Fingerabdruck-Symbole, sonst immer Feather
  if (family === 'mci') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Feather name={name} size={size} color={color} />;
}
