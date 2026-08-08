import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  C,
  CATCHPHRASE_OPTIONS,
  PERSONALITY_OPTIONS,
  ROLE_OPTIONS,
  SPEAKING_STYLE_OPTIONS,
} from "../constants/theme";
import { useWorkspace } from "../context/WorkspaceContext";
import { emptyCreator } from "../types/workspace";

function ChipGroup({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreatorEditScreen({ navigation, route }: any) {
  const { creators, upsertCreator, deleteCreator } = useWorkspace();
  const creatorId: string | undefined = route?.params?.creatorId;
  const existing = creators.find((c) => c.id === creatorId);
  const initial = useMemo(() => existing ?? emptyCreator(), [existing]);
  const [form, setForm] = useState(initial);
  const [customCatchphrase, setCustomCatchphrase] = useState("");
  const canSave = form.name.trim().length > 0;

  function toggle(key: "personalities" | "speakingStyles" | "catchphrases", item: string) {
    setForm((prev) => {
      const list = prev[key];
      const next = list.includes(item)
        ? list.filter((x) => x !== item)
        : [...list, item];
      return { ...prev, [key]: next };
    });
  }

  function addCustomCatchphrase() {
    const next = customCatchphrase.trim();
    if (!next) return;
    setForm((prev) => {
      if (prev.catchphrases.includes(next)) return prev;
      return { ...prev, catchphrases: [...prev.catchphrases, next] };
    });
    setCustomCatchphrase("");
  }

  async function handleSave() {
    if (!canSave) return;
    await upsertCreator({ ...form, name: form.name.trim() });
    navigation.goBack();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert("刪除角色", "確定要刪除此角色？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          await deleteCreator(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.page}>
              <Text style={styles.title}>
                {existing ? "編輯角色" : "新增角色"}
              </Text>

              <Text style={styles.label}>姓名 *</Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                style={styles.input}
                placeholder="例如：小安"
                placeholderTextColor={C.textTertiary}
              />

              <Text style={styles.label}>身分</Text>
              <ChipGroup
                items={ROLE_OPTIONS}
                selected={form.role ? [form.role] : []}
                onToggle={(item) =>
                  setForm((p) => ({
                    ...p,
                    role: p.role === item ? "" : item,
                  }))
                }
              />
              <TextInput
                value={form.role}
                onChangeText={(v) => setForm((p) => ({ ...p, role: v }))}
                style={[styles.input, { marginTop: 8 }]}
                placeholder="或自行輸入身分"
                placeholderTextColor={C.textTertiary}
              />

              <Text style={styles.label}>個性（可複選）</Text>
              <ChipGroup
                items={PERSONALITY_OPTIONS}
                selected={form.personalities}
                onToggle={(item) => toggle("personalities", item)}
              />

              <Text style={styles.label}>說話風格（可複選）</Text>
              <ChipGroup
                items={SPEAKING_STYLE_OPTIONS}
                selected={form.speakingStyles}
                onToggle={(item) => toggle("speakingStyles", item)}
              />

              <Text style={styles.label}>口頭禪（可複選）</Text>
              <ChipGroup
                items={[
                  ...CATCHPHRASE_OPTIONS,
                  ...form.catchphrases.filter(
                    (item) => !CATCHPHRASE_OPTIONS.includes(item)
                  ),
                ]}
                selected={form.catchphrases}
                onToggle={(item) => toggle("catchphrases", item)}
              />
              <View style={styles.customRow}>
                <TextInput
                  value={customCatchphrase}
                  onChangeText={setCustomCatchphrase}
                  style={[styles.input, styles.customInput]}
                  placeholder="自行輸入口頭禪"
                  placeholderTextColor={C.textTertiary}
                  onSubmitEditing={addCustomCatchphrase}
                  returnKeyType="done"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="加入口頭禪"
                  onPress={addCustomCatchphrase}
                  style={[
                    styles.addBtn,
                    !customCatchphrase.trim() && styles.addBtnDisabled,
                  ]}
                  disabled={!customCatchphrase.trim()}
                >
                  <Text
                    style={[
                      styles.addBtnText,
                      !customCatchphrase.trim() && styles.addBtnTextDisabled,
                    ]}
                  >
                    加入
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            {existing ? (
              <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteText}>刪除</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.cta, !canSave && styles.ctaDisabled]}
              disabled={!canSave}
              onPress={handleSave}
            >
              <Text style={styles.ctaText}>儲存</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { alignItems: "center", paddingBottom: 20 },
  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: { color: C.text, fontSize: 24, fontWeight: "700", marginBottom: 8 },
  label: {
    marginTop: 16,
    marginBottom: 8,
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    color: C.text,
    fontSize: 16,
    backgroundColor: C.white,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipActive: { backgroundColor: C.black, borderColor: C.black },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: C.white },
  customRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customInput: { flex: 1 },
  addBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  addBtnDisabled: { backgroundColor: C.disabled },
  addBtnText: { color: C.white, fontSize: 14, fontWeight: "700" },
  addBtnTextDisabled: { color: C.disabledText },
  bottomBar: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    paddingHorizontal: 24,
    paddingVertical: 14,
    justifyContent: "center",
  },
  deleteBtn: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },
  deleteText: { color: C.heart, fontWeight: "600" },
  cta: {
    flex: 1,
    maxWidth: 480,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: { color: C.white, fontSize: 16, fontWeight: "600" },
});
