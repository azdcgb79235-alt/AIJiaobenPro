import React, { useState } from "react";
import {
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

import { C } from "../constants/theme";
import { useWorkspace } from "../context/WorkspaceContext";
import { WORKSPACE_INDUSTRIES } from "../types/workspace";

export default function WorkspaceCreateScreen({ navigation, route }: any) {
  const { createWorkspace, hasWorkspace } = useWorkspace();
  const isFirst = !hasWorkspace || route?.params?.first === true;

  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState<string>(WORKSPACE_INDUSTRIES[0]);
  const [brandIntro, setBrandIntro] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await createWorkspace({
        name: name.trim(),
        brandName: brandName.trim(),
        industry,
        brandIntro: brandIntro.trim(),
      });
      if (isFirst) {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView
        style={styles.safe}
        edges={isFirst ? ["top", "bottom"] : ["bottom"]}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.page}>
              <Text style={styles.eyebrow}>AI Creator Workspace</Text>
              <Text style={styles.title}>
                {isFirst ? "建立你的 Workspace" : "新增 Workspace"}
              </Text>
              <Text style={styles.subtitle}>
                30 秒完成。一家公司、一個品牌、一位客戶，都是一個獨立工作空間。
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Workspace 名稱 *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="例如：MOMO 咖啡、ABC 健身"
                  placeholderTextColor={C.textTertiary}
                  style={styles.input}
                  autoFocus
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>品牌名稱（選填）</Text>
                <TextInput
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="可與 Workspace 同名"
                  placeholderTextColor={C.textTertiary}
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>產業 *</Text>
                <View style={styles.chipRow}>
                  {WORKSPACE_INDUSTRIES.map((item) => {
                    const active = industry === item;
                    return (
                      <Pressable
                        key={item}
                        accessibilityRole="button"
                        accessibilityLabel={item}
                        accessibilityState={{ selected: active }}
                        onPress={() => setIndustry(item)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>一句品牌介紹</Text>
                <TextInput
                  value={brandIntro}
                  onChangeText={setBrandIntro}
                  placeholder="例如：幫上班族每天喝到好咖啡"
                  placeholderTextColor={C.textTertiary}
                  style={[styles.input, styles.inputMulti]}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Text style={styles.logoNote}>
                Logo 可之後再補。其餘品牌／產品／角色資料之後慢慢完善即可。
              </Text>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="建立 Workspace"
              disabled={!canSave}
              onPress={handleSave}
              style={[styles.cta, !canSave && styles.ctaDisabled]}
            >
              <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
                {saving ? "建立中…" : "建立並進入工作台"}
              </Text>
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
  scroll: { alignItems: "center", paddingBottom: 16 },
  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  eyebrow: {
    color: C.textTertiary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    marginTop: 10,
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 28,
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  field: { marginBottom: 18 },
  label: {
    marginBottom: 8,
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.white,
  },
  inputMulti: {
    minHeight: 88,
    paddingTop: 13,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipActive: {
    borderColor: C.black,
    backgroundColor: C.black,
  },
  chipText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  chipTextActive: {
    color: C.white,
  },
  logoNote: {
    color: C.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  bottomBar: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  cta: {
    width: "100%",
    maxWidth: 480,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
  ctaTextDisabled: { color: C.disabledText },
});
