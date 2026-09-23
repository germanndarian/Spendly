// Tab-Leiste unten mit den drei Hauptbereichen. Der aktive Tab ist grün.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/typography';
import Icon from '../components/Icon';
import OverviewScreen from '../screens/OverviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Icon pro Tab (Feather-Icons)
const TAB_ICONS = {
  Overview: 'grid',
  History: 'clock',
  Settings: 'sliders',
};

export default function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // jeder Screen hat seinen eigenen Kopfbereich
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 12,
        },
        tabBarIcon: ({ color }) => <Icon name={TAB_ICONS[route.name]} size={22} color={color} />,
      })}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} options={{ title: 'Übersicht' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Verlauf' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Einstellungen' }} />
    </Tab.Navigator>
  );
}
