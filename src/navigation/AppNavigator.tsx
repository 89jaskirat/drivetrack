import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { CarLoader } from '../components/CarLoader';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ComposeScreen } from '../screens/ComposeScreen';
import { DealsScreen } from '../screens/DealsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { InviteScreen } from '../screens/InviteScreen';
import { KnowledgeScreen } from '../screens/KnowledgeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RepeatingExpensesScreen } from '../screens/RepeatingExpensesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ShiftScreen } from '../screens/ShiftScreen';
import { TaxReportScreen } from '../screens/TaxReportScreen';
import { useAppState } from '../state/AppStateContext';
import { AuthScreen } from '../screens/AuthScreen';
import { MainTabParamList, RootStackParamList } from '../types';
import { appTheme } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home: '⌂',
  Community: '⬡',
  Deals: '★',
  Knowledge: '▣',
  Profile: '◉',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: appTheme.surface.hero,
          borderTopWidth: 1,
          borderTopColor: appTheme.surface.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: appTheme.colors.playstationBlue,
        tabBarInactiveTintColor: appTheme.colors.bodyGray,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 18, color }}>{TAB_ICONS[route.name] ?? '●'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Deals" component={DealsScreen} />
      <Tab.Screen name="Knowledge" component={KnowledgeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { state, ready } = useAppState();

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: appTheme.surface.screen, alignItems: 'center', justifyContent: 'center' }}>
        <CarLoader label="Starting up…" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: appTheme.surface.screen },
      }}
    >
      {state.signedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="TaxReport" component={TaxReportScreen} />
          <Stack.Screen name="RepeatingExpenses" component={RepeatingExpensesScreen} />
          <Stack.Screen name="Invite" component={InviteScreen} />
          <Stack.Screen name="Shift" component={ShiftScreen} />
          <Stack.Screen name="Compose" component={ComposeScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
