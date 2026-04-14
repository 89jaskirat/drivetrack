import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from '../screens/AuthScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TrackScreen } from '../screens/TrackScreen';
import { useAppState } from '../state/AppStateContext';
import { MainTabParamList, RootStackParamList } from '../types';
import { appTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: appTheme.colors.playstationBlue,
          borderTopWidth: 0,
          borderRadius: appTheme.radii.button,
          marginHorizontal: 16,
          marginBottom: 16,
          height: 68,
          position: 'absolute',
        },
        tabBarActiveTintColor: appTheme.colors.playstationBlue,
        tabBarInactiveTintColor: appTheme.colors.inverseWhite,
        tabBarActiveBackgroundColor: appTheme.colors.paperWhite,
        tabBarItemStyle: {
          borderRadius: appTheme.radii.button,
          marginVertical: 8,
          marginHorizontal: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'none',
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Track" component={TrackScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { state } = useAppState();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appTheme.colors.consoleBlack },
      }}
    >
      {state.signedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
