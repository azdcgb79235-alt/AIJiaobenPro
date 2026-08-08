import React, { useMemo, useState } from "react";
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
import { emptyBrand } from "../types/workspace";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function BrandSetupScreen({ navigation, route }: any) {
  const { brand, upsertBrand } = useWorkspace();
  const isEdit = route?.name === "BrandEdit" || Boolean(route?.params?.edit);

  const initial = useMemo(() => brand ?? emptyBrand(), [brand]);
  const [form, setForm] = useState(initial);

  const canSave = form.name.trim().length > 0;

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!canSave) return;
    await upsertBrand({
      ...form,
      name: form.name.trim(),
    });
    if (isEdit) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={isEdit ? ["bottom"] : ["top", "bottom"]}>
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
              <Text style={styles.title}>
                {isEdit ? "品牌中心" : "建立你的品牌"}
              </Text>
              <Text style={styles.subtitle}>
                填寫後 AI 會更懂你的品牌語氣；其餘欄位皆可略過，之後再慢慢補也沒關係。
              </Text>

              <Field
                label="品牌名稱 *"
                value={form.name}
                onChangeText={(v) => patch("name", v)}
                placeholder="例如：AI Creator Studio"
              />
              <Field
                label="公司名稱"
                value={form.company}
                onChangeText={(v) => patch("company", v)}
              />
              <Field
                label="品牌介紹"
                value={form.intro}
                onChangeText={(v) => patch("intro", v)}
                multiline
              />
              <Field
                label="品牌定位"
                value={form.positioning}
                onChangeText={(v) => patch("positioning", v)}
              />
              <Field
                label="品牌價值"
                value={form.values}
                onChangeText={(v) => patch("values", v)}
                multiline
              />
              <Field
                label="品牌特色"
                value={form.features}
                onChangeText={(v) => patch("features", v)}
                multiline
              />
              <Field
                label="品牌口號"
                value={form.slogan}
                onChangeText={(v) => patch("slogan", v)}
              />
              <Field
                label="品牌網址"
                value={form.website}
                onChangeText={(v) => patch("website", v)}
                placeholder="https://"
              />
              <Field
                label="品牌禁止事項"
                value={form.prohibitions}
                onChangeText={(v) => patch("prohibitions", v)}
                placeholder={"不要誇大\n不要政治\n不要攻擊同業"}
                multiline
              />

              <Text style={styles.sectionTitle}>品牌風格</Text>
              <Field
                label="品牌個性"
                value={form.style.personality}
                onChangeText={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    style: { ...prev.style, personality: v },
                  }))
                }
                placeholder="例如：專業、有溫度"
              />
              <Field
                label="品牌語氣"
                value={form.style.tone}
                onChangeText={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    style: { ...prev.style, tone: v },
                  }))
                }
                placeholder="例如：口語、清楚、有節奏"
              />
              <Field
                label="品牌 CTA"
                value={form.style.cta}
                onChangeText={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    style: { ...prev.style, cta: v },
                  }))
                }
                placeholder="例如：私訊了解 / 點連結購買"
              />
              <Field
                label="品牌 Hashtag"
                value={form.style.hashtags}
                onChangeText={(v) =>
                  setForm((prev) => ({
                    ...prev,
                    style: { ...prev.style, hashtags: v },
                  }))
                }
                placeholder="#品牌 #短影音"
              />
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSave}
              onPress={handleSave}
              style={[styles.cta, !canSave && styles.ctaDisabled]}
            >
              <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
                {isEdit ? "儲存品牌" : "完成並進入工作台"}
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
  scroll: { alignItems: "center", paddingBottom: 20 },
  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 8,
    color: C.text,
    fontSize: 17,
    fontWeight: "700",
  },
  field: { marginTop: 14 },
  label: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    color: C.text,
    fontSize: 16,
  },
  inputMulti: {
    height: 110,
    paddingTop: 14,
    paddingBottom: 14,
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
    height: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },
  ctaDisabled: { backgroundColor: C.disabled },
  ctaText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
  },
  ctaTextDisabled: { color: C.disabledText },
});
