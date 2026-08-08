import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { C } from "../constants/theme";
import { useWorkspace } from "../context/WorkspaceContext";

const LINKS = [
  {
    title: "品牌中心",
    desc: "品牌資訊、禁止事項與風格",
    route: "BrandEdit",
  },
  {
    title: "產品資料庫",
    desc: "管理可重複選用的產品",
    route: "Products",
  },
  {
    title: "創作者角色",
    desc: "角色個性、說話風格與口頭禪",
    route: "Creators",
  },
  {
    title: "腳本庫",
    desc: "全部腳本、收藏與拍攝狀態",
    route: "ScriptLibrary",
  },
];

export default function SettingsScreen({ navigation }: any) {
  const { activeWorkspace, brand, products, creators, scripts } =
    useWorkspace();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <Text style={styles.title}>設定</Text>
            <Text style={styles.subtitle}>
              {activeWorkspace?.name || brand?.name || "Workspace"} · 產品{" "}
              {products.length} · 角色 {creators.length} · 腳本 {scripts.length}
            </Text>

            <View style={styles.list}>
              {LINKS.map((item) => (
                <Pressable
                  key={item.route}
                  style={styles.card}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.desc}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.note}>
              資料儲存在本機（AsyncStorage）。架構已預留登入、Firebase / Supabase
              與雲端同步。
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scroll: { alignItems: "center", paddingBottom: 28 },
  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: { color: C.text, fontSize: 26, fontWeight: "700" },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  list: { gap: 10 },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "700" },
  cardDesc: {
    marginTop: 6,
    color: C.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  note: {
    marginTop: 22,
    color: C.textTertiary,
    fontSize: 12.5,
    lineHeight: 19,
  },
});
