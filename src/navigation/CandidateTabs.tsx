import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  CandidateApplicationsStackParamList,
  CandidateJobsStackParamList,
  CandidateTabParamList,
  MessagesStackParamList,
} from '../types';
import { Colors } from '../constants/tokens';
import { stackOptions, tabBarOptions } from './stackOptions';

import JobListingsScreen from '../screens/candidate/JobListingsScreen';
import JobDetailScreen from '../screens/candidate/JobDetailScreen';
import ApplyScreen from '../screens/candidate/ApplyScreen';
import MyApplicationsScreen from '../screens/candidate/MyApplicationsScreen';
import ConversationsScreen from '../screens/shared/ConversationsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator<CandidateTabParamList>();
const JobsStack = createNativeStackNavigator<CandidateJobsStackParamList>();
const AppsStack = createNativeStackNavigator<CandidateApplicationsStackParamList>();
const MsgStack = createNativeStackNavigator<MessagesStackParamList>();
const tint = Colors.success;

function FindJobsStack() {
  return (
    <JobsStack.Navigator screenOptions={stackOptions(tint)}>
      <JobsStack.Screen name="JobListings" component={JobListingsScreen} options={{ headerShown: false }} />
      <JobsStack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job details' }} />
      <JobsStack.Screen name="Apply" component={ApplyScreen} options={{ title: 'Apply' }} />
    </JobsStack.Navigator>
  );
}

function ApplicationsStack() {
  return (
    <AppsStack.Navigator screenOptions={stackOptions(tint)}>
      <AppsStack.Screen name="MyApplications" component={MyApplicationsScreen} options={{ headerShown: false }} />
      <AppsStack.Screen name="Chat" component={ChatScreen} />
    </AppsStack.Navigator>
  );
}

function MessagesStack() {
  return (
    <MsgStack.Navigator screenOptions={stackOptions(tint)}>
      <MsgStack.Screen name="Conversations" component={ConversationsScreen} options={{ headerShown: false }} />
      <MsgStack.Screen name="Chat" component={ChatScreen} />
    </MsgStack.Navigator>
  );
}

const ICONS: Record<keyof CandidateTabParamList, [string, string]> = {
  FindJobs: ['search', 'search-outline'],
  Applications: ['document-text', 'document-text-outline'],
  Messages: ['chatbubbles', 'chatbubbles-outline'],
  Profile: ['person', 'person-outline'],
};

export default function CandidateTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabBarOptions(tint),
        tabBarIcon: ({ color, size, focused }) => {
          const [active, inactive] = ICONS[route.name];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="FindJobs" component={FindJobsStack} options={{ title: 'Jobs' }} />
      <Tab.Screen name="Applications" component={ApplicationsStack} options={{ title: 'Applications' }} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
