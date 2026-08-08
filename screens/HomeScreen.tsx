import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { C } from "../constants/theme";
import { useWorkspace } from "../context/WorkspaceContext";
import type { ScriptRecord } from "../types/workspace";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const HOME_LIST_LIMIT = 3;

type FadeInProps = {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

function FadeIn({ delay = 0, style, children }: FadeInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function openScript(navigation: any, item: ScriptRecord) {
  navigation.navigate("Result", {
    scriptId: item.id,
    result: item.result,
    prompt: item.prompt,
    elapsedMs: item.elapsedMs ?? 0,
  });
}

export default function HomeScreen({ navigation }: any) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manageId, setManageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [manageNotice, setManageNotice] = useState<string | null>(null);
  const {
    activeWorkspace,
    workspaces,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
    draft,
    recentScripts,
    favoriteScripts,
    toShootScripts,
    unpublishedScripts,
  } = useWorkspace();

  const recentPreview = recentScripts.slice(0, HOME_LIST_LIMIT);
  const favoritePreview = favoriteScripts.slice(0, HOME_LIST_LIMIT);
  const workspaceLabel = activeWorkspace?.name || "Workspace";
  const manageWorkspace =
    workspaces.find((w) => w.id === manageId) ?? null;

  useEffect(() => {
    if (!manageWorkspace) return;
    setRenameValue(manageWorkspace.name);
    setConfirmDelete(false);
    setManageNotice(null);
  }, [manageWorkspace?.id, manageWorkspace?.name]);

  function continueDraft() {
    if (!draft) return;
    if (draft.platform && draft.type) {
      navigation.navigate("Prompt", {
        platform: draft.platform,
        type: draft.type,
        continueDraft: true,
      });
      return;
    }
    navigation.navigate("Platform", {
      continueDraft: true,
      platform: draft.platform,
    });
  }

  function openPicker() {
    setManageId(null);
    setConfirmDelete(false);
    setManageNotice(null);
    setPickerOpen(true);
  }

  async function handleSwitch(id: string) {
    setPickerOpen(false);
    setManageId(null);
    setConfirmDelete(false);
    setManageNotice(null);
    if (id === activeWorkspace?.id) return;
    await switchWorkspace(id);
  }

  async function handleRename() {
    if (!manageWorkspace) return;
    const next = renameValue.trim();
    if (!next || next === manageWorkspace.name) return;
    await renameWorkspace(manageWorkspace.id, next);
  }

  function handleDeletePress() {
    if (!manageWorkspace) return;

    if (workspaces.length <= 1) {
      setConfirmDelete(false);
      setManageNotice("至少需要保留一個工作空間。");
      return;
    }

    setManageNotice(null);
    setConfirmDelete(true);
  }

  async function handleConfirmDelete() {
    if (!manageWorkspace) return;
    const result = await deleteWorkspace(manageWorkspace.id);
    if (!result.ok && result.reason === "last") {
      setConfirmDelete(false);
      setManageNotice("至少需要保留一個工作空間。");
      return;
    }
    setConfirmDelete(false);
    setManageId(null);
    setPickerOpen(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="切換 Workspace"
              onPress={openPicker}
              style={styles.workspaceBtn}
            >
              <Text style={styles.workspaceChevron}>▼</Text>
              <View style={styles.workspaceTextWrap}>
                <Text style={styles.workspaceLabel}>Workspace</Text>
                <Text style={styles.workspaceName} numberOfLines={1}>
                  {workspaceLabel}
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="設定"
              onPress={() => navigation.navigate("Settings")}
              style={styles.settingsBtn}
            >
              <Text style={styles.settingsText}>設定</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <FadeIn delay={0}>
              <Text style={styles.productName}>AI Creator Workspace</Text>
              <Text style={styles.tagline}>
                每天的短影音工作台 · 腳本、拍攝、發布
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{toShootScripts.length}</Text>
                  <Text style={styles.statLabel}>待拍攝</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {unpublishedScripts.length}
                  </Text>
                  <Text style={styles.statLabel}>未發布</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{recentScripts.length}</Text>
                  <Text style={styles.statLabel}>最近腳本</Text>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="開始創作"
                onPress={() => navigation.navigate("Platform")}
                style={styles.primaryCta}
              >
                <Text style={styles.primaryCtaText}>開始創作</Text>
              </Pressable>

              {draft ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="繼續創作"
                  style={styles.continueCard}
                  onPress={continueDraft}
                >
                  <Text style={styles.continueTitle}>繼續創作</Text>
                  <Text style={styles.continueMeta}>
                    {[draft.platform, draft.type].filter(Boolean).join(" · ") ||
                      "尚未選擇類型"}
                  </Text>
                </Pressable>
              ) : null}
            </FadeIn>

            <FadeIn delay={80}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>最近腳本</Text>
                {recentScripts.length > 0 ? (
                  <Pressable
                    onPress={() =>
                      navigation.navigate("ScriptLibrary", { filter: "recent" })
                    }
                  >
                    <Text style={styles.sectionLink}>全部</Text>
                  </Pressable>
                ) : null}
              </View>

              {recentPreview.length === 0 ? (
                <Text style={styles.emptyLine}>尚無腳本，點上方開始創作</Text>
              ) : (
                <View style={styles.list}>
                  {recentPreview.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.scriptCard}
                      onPress={() => openScript(navigation, item)}
                    >
                      <Text style={styles.scriptTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.scriptMeta}>
                        {item.platform} · {item.type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </FadeIn>

            {favoritePreview.length > 0 ? (
              <FadeIn delay={130}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>我的收藏</Text>
                  <Pressable
                    onPress={() =>
                      navigation.navigate("ScriptLibrary", {
                        filter: "favorites",
                      })
                    }
                  >
                    <Text style={styles.sectionLink}>全部</Text>
                  </Pressable>
                </View>

                <View style={styles.list}>
                  {favoritePreview.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.scriptCard}
                      onPress={() => openScript(navigation, item)}
                    >
                      <Text style={styles.scriptTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.scriptMeta}>
                        {item.platform} · {item.type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </FadeIn>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setManageId(null);
          setPickerOpen(false);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setManageId(null);
            setPickerOpen(false);
          }}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>切換 Workspace</Text>
            <ScrollView style={styles.modalList}>
              {workspaces.map((ws) => {
                const active = ws.id === activeWorkspace?.id;
                const managing = ws.id === manageId;
                return (
                  <View
                    key={ws.id}
                    style={[
                      styles.modalItem,
                      active && styles.modalItemActive,
                      managing && styles.modalItemManaging,
                    ]}
                  >
                    <Pressable
                      style={styles.modalItemMain}
                      onPress={() => handleSwitch(ws.id)}
                    >
                      <Text
                        style={[
                          styles.modalItemTitle,
                          active && styles.modalItemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {ws.name}
                      </Text>
                      <Text
                        style={[
                          styles.modalItemMeta,
                          active && styles.modalItemMetaActive,
                        ]}
                        numberOfLines={1}
                      >
                        {ws.industry}
                        {ws.brandName ? ` · ${ws.brandName}` : ""}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`管理 ${ws.name}`}
                      onPress={() => {
                        setManageId((prev) => {
                          if (prev === ws.id) {
                            setConfirmDelete(false);
                            setManageNotice(null);
                            return null;
                          }
                          setRenameValue(ws.name);
                          setConfirmDelete(false);
                          setManageNotice(null);
                          return ws.id;
                        });
                      }}
                      style={styles.manageBtn}
                    >
                      <Text
                        style={[
                          styles.manageBtnText,
                          active && styles.manageBtnTextActive,
                        ]}
                      >
                        管理
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            {manageWorkspace ? (
              <View style={styles.managePanel}>
                <Text style={styles.managePanelTitle}>
                  管理「{manageWorkspace.name}」
                </Text>

                <Text style={styles.manageLabel}>重新命名</Text>
                <View style={styles.renameRow}>
                  <TextInput
                    value={renameValue}
                    onChangeText={setRenameValue}
                    placeholder="Workspace 名稱"
                    placeholderTextColor={C.textTertiary}
                    style={styles.renameInput}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="儲存名稱"
                    onPress={handleRename}
                    style={styles.renameSave}
                  >
                    <Text style={styles.renameSaveText}>儲存</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="更換 Logo"
                  disabled
                  style={styles.logoReserved}
                >
                  <Text style={styles.logoReservedText}>
                    更換 Logo（預留）
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="刪除 Workspace"
                  onPress={handleDeletePress}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>刪除 Workspace</Text>
                </Pressable>

                {manageNotice ? (
                  <Text style={styles.manageNotice}>{manageNotice}</Text>
                ) : null}

                {confirmDelete ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>
                      確定要刪除此工作空間嗎？
                    </Text>
                    <Text style={styles.confirmBody}>
                      刪除後，此工作空間的所有資料將永久移除，且無法復原。
                    </Text>
                    <View style={styles.confirmActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="取消"
                        onPress={() => setConfirmDelete(false)}
                        style={styles.confirmCancel}
                      >
                        <Text style={styles.confirmCancelText}>取消</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="確認刪除"
                        onPress={handleConfirmDelete}
                        style={styles.confirmDelete}
                      >
                        <Text style={styles.confirmDeleteText}>確認刪除</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Pressable
              style={styles.modalAdd}
              onPress={() => {
                setManageId(null);
                setPickerOpen(false);
                navigation.navigate("WorkspaceCreate");
              }}
            >
              <Text style={styles.modalAddText}>＋ 新增 Workspace</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  topBar: { alignItems: "center" },
  topBarInner: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  workspaceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  workspaceChevron: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "700",
  },
  workspaceTextWrap: { flex: 1 },
  workspaceLabel: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "600",
  },
  workspaceName: {
    marginTop: 2,
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  settingsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.surface,
  },
  settingsText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center" },
  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 56,
  },
  productName: {
    color: C.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  tagline: {
    marginTop: 8,
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  statsRow: {
    marginTop: 28,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: "center",
  },
  statValue: {
    color: C.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  statLabel: {
    marginTop: 4,
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  primaryCta: {
    marginTop: 24,
    width: "100%",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  primaryCtaText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "700",
  },
  continueCard: {
    marginTop: 12,
    width: "100%",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.black,
    backgroundColor: C.white,
  },
  continueTitle: { color: C.text, fontSize: 15.5, fontWeight: "700" },
  continueMeta: {
    marginTop: 4,
    color: C.textSecondary,
    fontSize: 13,
  },
  sectionHead: {
    marginTop: 36,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionLink: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyLine: {
    color: C.textTertiary,
    fontSize: 13.5,
    fontWeight: "500",
  },
  list: { gap: 10 },
  scriptCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  scriptTitle: { color: C.text, fontSize: 15.5, fontWeight: "700" },
  scriptMeta: {
    marginTop: 5,
    color: C.textTertiary,
    fontSize: 12.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 11, 15, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: "70%",
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  modalList: { maxHeight: 320 },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: C.surface,
  },
  modalItemActive: {
    backgroundColor: C.black,
  },
  modalItemManaging: {
    borderWidth: 1.5,
    borderColor: C.border,
  },
  modalItemMain: {
    flex: 1,
    paddingVertical: 4,
    paddingRight: 8,
  },
  modalItemTitle: {
    color: C.text,
    fontSize: 15.5,
    fontWeight: "700",
  },
  modalItemTitleActive: { color: C.white },
  modalItemMeta: {
    marginTop: 4,
    color: C.textTertiary,
    fontSize: 12.5,
  },
  modalItemMetaActive: {
    color: "rgba(255,255,255,0.72)",
  },
  manageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  manageBtnText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  manageBtnTextActive: {
    color: "rgba(255,255,255,0.85)",
  },
  managePanel: {
    marginTop: 4,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: C.surface,
  },
  managePanelTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  manageLabel: {
    color: C.textSecondary,
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 8,
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  renameInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.white,
  },
  renameSave: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.black,
  },
  renameSaveText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
  },
  logoReserved: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
    opacity: 0.65,
  },
  logoReservedText: {
    color: C.textTertiary,
    fontSize: 13.5,
    fontWeight: "600",
  },
  deleteBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.heart,
  },
  deleteBtnText: {
    color: C.heart,
    fontSize: 14,
    fontWeight: "700",
  },
  manageNotice: {
    marginTop: 10,
    color: C.heart,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  confirmBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  confirmTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  confirmBody: {
    marginTop: 8,
    color: C.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
  },
  confirmActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  confirmCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },
  confirmCancelText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  confirmDelete: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.heart,
  },
  confirmDeleteText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
  },
  modalAdd: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAddText: {
    color: C.text,
    fontSize: 15.5,
    fontWeight: "700",
  },
});
