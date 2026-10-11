import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  MessagesStackParamList,
  RecruiterJobsStackParamList,
  RecruiterTabParamList,
} from '../types';
import { Colors } from '../constants/tokens';
import { stackOptions, tabBarOptions } from './stackOptions';

import DashboardScreen from '../screens/recruiter/DashboardScreen';
import MyJobsScreen from '../screens/recruiter/MyJobsScreen';
import JobFormScreen from '../screens/recruiter/JobFormScreen';
import ApplicantsScreen from '../screens/recruiter/ApplicantsScreen';
import ApplicantDetailScreen from '../screens/recruiter/ApplicantDetailScreen';
import ConversationsScreen from '../screens/shared/ConversationsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator<RecruiterTabParamList>();
const JobsStack = createNativeStackNavigator<RecruiterJobsStackParamList>();
const MsgStack = createNativeStackNavigator<MessagesStackParamList>();
const tint = Colors.primary;

function RecruiterJobsStack() {
  return (
    <JobsStack.Navigator screenOptions={stackOptions(tint)}>
      <JobsStack.Screen name="MyJobs" component={MyJobsScreen} options={{ headerShown: false }} />
      <JobsStack.Screen name="JobForm" component={JobFormScreen} options={{ title: 'Post a job' }} />
      <JobsStack.Screen name="Applicants" component={ApplicantsScreen} />
      <JobsStack.Screen name="ApplicantDetail" component={ApplicantDetailScreen} options={{ title: 'Applicant' }} />
      <JobsStack.Screen name="Chat" component={ChatScreen} />
    </JobsStack.Navigator>
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

const ICONS: Record<keyof RecruiterTabParamList, [string, string]> = {
  Dashboard: ['grid', 'grid-outline'],
  RecruiterJobs: ['briefcase', 'briefcase-outline'],
  Messages: ['chatbubbles', 'chatbubbles-outline'],
  Profile: ['person', 'person-outline'],
};

export default function RecruiterTabs() {
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="RecruiterJobs"
        component={RecruiterJobsStack}
        options={{ title: 'My jobs', popToTopOnBlur: true }}
      />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
