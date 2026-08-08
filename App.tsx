import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import HomeScreen from "./screens/HomeScreen";
import PlatformScreen from "./screens/PlatformScreen";
import TypeScreen from "./screens/TypeScreen";
import PromptScreen from "./screens/PromptScreen";
import LoadingScreen from "./screens/LoadingScreen";
import ResultScreen from "./screens/ResultScreen";
import BrandSetupScreen from "./screens/BrandSetupScreen";
import ProductsScreen from "./screens/ProductsScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import CreatorsScreen from "./screens/CreatorsScreen";
import CreatorEditScreen from "./screens/CreatorEditScreen";
import ScriptLibraryScreen from "./screens/ScriptLibraryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import WorkspaceCreateScreen from "./screens/WorkspaceCreateScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { ready, hasWorkspace } = useWorkspace();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#0B0B0F" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={hasWorkspace ? "Home" : "WorkspaceCreate"}
      screenOptions={{
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="WorkspaceCreate"
        component={WorkspaceCreateScreen}
        options={{
          headerShown: hasWorkspace,
          title: "新增 Workspace",
        }}
        initialParams={{ first: !hasWorkspace }}
      />

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "設定" }}
      />

      <Stack.Screen
        name="BrandSetup"
        component={BrandSetupScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="BrandEdit"
        component={BrandSetupScreen}
        options={{ title: "品牌中心" }}
      />

      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: "產品資料庫" }}
      />

      <Stack.Screen
        name="ProductEdit"
        component={ProductEditScreen}
        options={{ title: "產品" }}
      />

      <Stack.Screen
        name="Creators"
        component={CreatorsScreen}
        options={{ title: "創作者角色" }}
      />

      <Stack.Screen
        name="CreatorEdit"
        component={CreatorEditScreen}
        options={{ title: "角色" }}
      />

      <Stack.Screen
        name="ScriptLibrary"
        component={ScriptLibraryScreen}
        options={{ title: "腳本庫" }}
      />

      <Stack.Screen
        name="Platform"
        component={PlatformScreen}
        options={{ title: "選擇平台" }}
      />

      <Stack.Screen
        name="Type"
        component={TypeScreen}
        options={{ title: "影片類型" }}
      />

      <Stack.Screen
        name="Prompt"
        component={PromptScreen}
        options={{ title: "AI 腳本設定" }}
      />

      <Stack.Screen
        name="Loading"
        component={LoadingScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />

      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: "生成結果" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </WorkspaceProvider>
  );
}
