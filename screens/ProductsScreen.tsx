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

export default function ProductsScreen({ navigation }: any) {
  const { products } = useWorkspace();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <Text style={styles.title}>產品資料庫</Text>
            <Text style={styles.subtitle}>
              建立產品後，生成腳本時可直接選取，不用重打。
            </Text>

            {products.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>尚未建立產品</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {products.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.card}
                    onPress={() =>
                      navigation.navigate("ProductEdit", { productId: item.id })
                    }
                  >
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.intro || item.features || "尚未填寫介紹"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            style={styles.cta}
            onPress={() => navigation.navigate("ProductEdit", {})}
          >
            <Text style={styles.ctaText}>新增產品</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  scroll: { alignItems: "center", paddingBottom: 20 },
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
  empty: {
    padding: 28,
    borderRadius: 18,
    backgroundColor: C.surface,
    alignItems: "center",
  },
  emptyText: { color: C.textTertiary, fontWeight: "600" },
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
  bottomBar: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  cta: {
    width: "100%",
    maxWidth: 480,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  ctaText: { color: C.white, fontSize: 16, fontWeight: "600" },
});
