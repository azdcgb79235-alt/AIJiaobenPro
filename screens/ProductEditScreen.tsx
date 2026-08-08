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

import { C } from "../constants/theme";
import { useWorkspace } from "../context/WorkspaceContext";
import { emptyProduct } from "../types/workspace";

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.inputMulti]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        placeholderTextColor={C.textTertiary}
      />
    </View>
  );
}

export default function ProductEditScreen({ navigation, route }: any) {
  const { products, upsertProduct, deleteProduct } = useWorkspace();
  const productId: string | undefined = route?.params?.productId;
  const existing = products.find((p) => p.id === productId);
  const initial = useMemo(() => existing ?? emptyProduct(), [existing]);
  const [form, setForm] = useState(initial);
  const canSave = form.name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    await upsertProduct({ ...form, name: form.name.trim() });
    navigation.goBack();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert("刪除產品", "確定要刪除此產品？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(existing.id);
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
                {existing ? "編輯產品" : "新增產品"}
              </Text>
              <Field
                label="產品名稱 *"
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              />
              <Field
                label="產品介紹"
                value={form.intro}
                onChangeText={(v) => setForm((p) => ({ ...p, intro: v }))}
                multiline
              />
              <Field
                label="產品特色"
                value={form.features}
                onChangeText={(v) => setForm((p) => ({ ...p, features: v }))}
                multiline
              />
              <Field
                label="適合族群"
                value={form.audience}
                onChangeText={(v) => setForm((p) => ({ ...p, audience: v }))}
              />
              <Field
                label="價格"
                value={form.price}
                onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
              />
              <Field
                label="優惠"
                value={form.offer}
                onChangeText={(v) => setForm((p) => ({ ...p, offer: v }))}
              />
              <Field
                label="FAQ"
                value={form.faq}
                onChangeText={(v) => setForm((p) => ({ ...p, faq: v }))}
                multiline
              />
              <Field
                label="使用情境"
                value={form.scenarios}
                onChangeText={(v) => setForm((p) => ({ ...p, scenarios: v }))}
                multiline
              />
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
    color: C.text,
    fontSize: 16,
    backgroundColor: C.white,
  },
  inputMulti: { height: 100, paddingTop: 14, paddingBottom: 14 },
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
