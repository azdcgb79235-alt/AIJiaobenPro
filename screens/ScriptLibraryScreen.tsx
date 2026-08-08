import React, { useMemo, useState } from "react";
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
import { ScriptStatus } from "../types/workspace";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "favorites", label: "收藏" },
  { key: "to_shoot", label: "待拍" },
  { key: "filmed", label: "已拍" },
  { key: "published", label: "已發布" },
];

const STATUS_LABEL: Record<ScriptStatus, string> = {
  draft: "草稿",
  ready: "就緒",
  to_shoot: "待拍",
  filmed: "已拍",
  published: "已發布",
};

export default function ScriptLibraryScreen({ navigation, route }: any) {
  const { scripts, updateScript, toggleFavorite, deleteScript } =
    useWorkspace();
  const initialFilter = route?.params?.filter ?? "all";
  const [filter, setFilter] = useState<string>(initialFilter);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(() => {
    let items = [...scripts].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    if (filter === "favorites") items = items.filter((s) => s.favorite);
    else if (filter === "recent") items = items.slice(0, 20);
    else if (filter !== "all") {
      items = items.filter((s) => s.status === filter);
    }
    return items;
  }, [scripts, filter]);

  async function handleConfirmDelete(id: string) {
    await deleteScript(id);
    setConfirmId(null);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.page}>
            <Text style={styles.title}>腳本庫</Text>
            <Text style={styles.subtitle}>
              管理草稿、待拍、已拍與已發布腳本。
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setFilter(item.key)}
                    style={[styles.filterChip, active && styles.filterActive]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {list.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>尚無腳本</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {list.map((item) => (
                  <View key={item.id} style={styles.card}>
                    <Pressable
                      onPress={() =>
                        navigation.navigate("Result", {
                          scriptId: item.id,
                          result: item.result,
                          prompt: item.prompt,
                          elapsedMs: item.elapsedMs ?? 0,
                        })
                      }
                    >
                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            toggleFavorite(item.id);
                          }}
                          hitSlop={8}
                        >
                          <Text style={styles.heart}>
                            {item.favorite ? "❤️" : "🤍"}
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={styles.meta}>
                        {item.platform} · {item.type} ·{" "}
                        {STATUS_LABEL[item.status]}
                      </Text>
                    </Pressable>

                    <View style={styles.statusRow}>
                      {(
                        [
                          "draft",
                          "to_shoot",
                          "filmed",
                          "published",
                        ] as ScriptStatus[]
                      ).map((status) => (
                        <Pressable
                          key={status}
                          onPress={() => updateScript(item.id, { status })}
                          style={[
                            styles.statusChip,
                            item.status === status && styles.statusChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              item.status === status && styles.statusTextActive,
                            ]}
                          >
                            {STATUS_LABEL[status]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {confirmId === item.id ? (
                      <View style={styles.confirmBox}>
                        <Text style={styles.confirmTitle}>確定刪除此腳本？</Text>
                        <Text style={styles.confirmBody}>
                          刪除後無法復原。
                        </Text>
                        <View style={styles.confirmActions}>
                          <Pressable
                            onPress={() => setConfirmId(null)}
                            style={styles.confirmCancel}
                          >
                            <Text style={styles.confirmCancelText}>取消</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleConfirmDelete(item.id)}
                            style={styles.confirmDelete}
                          >
                            <Text style={styles.confirmDeleteText}>
                              確認刪除
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => setConfirmId(item.id)}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>刪除</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
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
    marginBottom: 14,
    color: C.textSecondary,
    fontSize: 14,
  },
  filters: { gap: 8, paddingBottom: 14 },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  filterActive: { backgroundColor: C.black, borderColor: C.black },
  filterText: { color: C.textSecondary, fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: C.white },
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
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { flex: 1, color: C.text, fontSize: 16, fontWeight: "700" },
  heart: { fontSize: 18 },
  meta: { marginTop: 6, color: C.textTertiary, fontSize: 12.5 },
  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: C.surface,
  },
  statusChipActive: { backgroundColor: C.black },
  statusText: { color: C.textSecondary, fontSize: 11.5, fontWeight: "600" },
  statusTextActive: { color: C.white },
  deleteBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.heart,
    backgroundColor: C.white,
  },
  deleteBtnText: {
    color: C.heart,
    fontSize: 13,
    fontWeight: "700",
  },
  confirmBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: C.surface,
  },
  confirmTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  confirmBody: {
    marginTop: 4,
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  confirmActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  confirmCancel: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  confirmCancelText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  confirmDelete: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.heart,
  },
  confirmDeleteText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
