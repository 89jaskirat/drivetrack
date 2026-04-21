import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { trackScreenView } from './src/services/activityService';
import { AppStateProvider } from './src/state/AppStateContext';
import { appTheme } from './src/theme';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: appTheme.surface.screen,
    card: appTheme.surface.hero,
    text: appTheme.colors.inverseWhite,
    border: appTheme.colors.playstationBlue,
    primary: appTheme.colors.playstationBlue,
  },
};

function getActiveRouteName(state: any): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

export default function App() {
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useRef<any>(null);

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => {
            routeNameRef.current = getActiveRouteName(navigationRef.current?.getRootState());
          }}
          onStateChange={(state) => {
            const currentRoute = getActiveRouteName(state);
            if (currentRoute && currentRoute !== routeNameRef.current) {
              trackScreenView(currentRoute);
              routeNameRef.current = currentRoute;
            }
          }}
        >
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
