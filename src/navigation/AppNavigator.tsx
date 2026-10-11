import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import AuthStack from './AuthStack';
import RecruiterTabs from './RecruiterTabs';
import CandidateTabs from './CandidateTabs';
import { Loader } from '../components/ui';

const Root = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { session, role, isLoading } = useAuth();

  if (isLoading) return <Loader />;

  // Each role gets its own app: Recruiter panel or Job Finder panel.
  const signedIn = !!session && !!role;
  return (
    <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {signedIn ? (
        <Root.Screen name="Main" component={role === 'recruiter' ? RecruiterTabs : CandidateTabs} />
      ) : (
        <Root.Screen name="Auth" component={AuthStack} />
      )}
    </Root.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
