import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateScript } from "../services/api";

const C = {
  bg: "#FFFFFF",
  surface: "#F6F6F7",
  border: "#ECECEF",
  text: "#0B0B0F",
  textSecondary: "#6B6B73",
  textTertiary: "#9A9AA2",
  black: "#0B0B0F",
  white: "#FFFFFF",
  success: "#16A34A",
  errorBg: "#FEF2F2",
  errorBorder: "#FECACA",
  errorText: "#B42318",
};

const STEPS = [
  "分析商品...",
  "分析目標客群...",
  "建立最佳 Hook...",
  "撰寫腳本...",
  "建立 CTA...",
  "建立 Hashtags...",
  "建立拍攝建議...",
  "完成",
];

const LAST_STEP = STEPS.length - 1;
const STEP_DURATION = 800;

const EMPTY_RESULT_MESSAGE = "AI 沒有回傳內容，請再試一次。";
const CONNECTION_MESSAGE =
  "無法連線到 AI 伺服器。請確認網路連線與後端服務狀態後再試一次。";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

type StepRowProps = {
  label: string;
  state: "hidden" | "active" | "done";
  isFinal: boolean;
};

function StepRow({ label, state, isFinal }: StepRowProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === "hidden") return;

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
  }, [progress, state]);

  const showSpinner = state === "active" && !isFinal;

  return (
    <Animated.View
      style={[
        styles.stepRow,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.stepMark}>
        {showSpinner ? (
          <ActivityIndicator size="small" color={C.textTertiary} />
        ) : (
          <Text style={styles.stepCheck}>✓</Text>
        )}
      </View>

      <Text
        style={[
          styles.stepText,
          state === "done" && styles.stepTextDone,
          isFinal && state !== "hidden" && styles.stepTextFinal,
        ]}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export default function LoadingScreen({ route, navigation }: any) {
  const prompt: string = route?.params?.prompt ?? "";
  const meta = route?.params?.meta;

  const [step, setStep] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resultRef = useRef<string | null>(null);
  const elapsedRef = useRef(0);
  const mountedRef = useRef(true);

  const logoScale = useRef(new Animated.Value(0.94)).current;
  const logoOpacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runGeneration = useCallback(async () => {
    const startedAt = Date.now();

    try {
      const data = await generateScript(prompt);

      if (!data || typeof data.result !== "string" || data.result === "") {
        throw new Error(EMPTY_RESULT_MESSAGE);
      }

      if (!mountedRef.current) return;

      elapsedRef.current = Date.now() - startedAt;
      resultRef.current = data.result;
      setResult(data.result);
    } catch (e) {
      if (!mountedRef.current) return;

      const raw = e instanceof Error ? e.message : "";

      setError(raw === EMPTY_RESULT_MESSAGE ? raw : CONNECTION_MESSAGE);
    }
  }, [prompt]);

  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(logoScale, {
            toValue: 0.94,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
        Animated.sequence([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0.55,
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= LAST_STEP) return prev;

        // 「完成」只在 AI 真的回傳結果後才顯示，避免謊報進度。
        if (prev === LAST_STEP - 1 && resultRef.current === null) return prev;

        return prev + 1;
      });
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (step !== LAST_STEP || result === null) return;

    const timer = setTimeout(() => {
      navigation.replace("Result", {
        result,
        prompt,
        elapsedMs: elapsedRef.current,
        meta,
      });
    }, STEP_DURATION);

    return () => clearTimeout(timer);
  }, [meta, navigation, prompt, result, step]);

  function handleRetry() {
    resultRef.current = null;
    setResult(null);
    setError(null);
    setStep(0);
    runGeneration();
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.page}>
          <Animated.View
            style={[
              styles.logoCircle,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Text style={styles.logo}>🤖</Text>
          </Animated.View>

          <Text style={styles.title}>AI 正在打造你的爆款腳本</Text>

          <Text style={styles.subtitle}>
            這通常需要幾秒鐘，請不要關閉畫面。
          </Text>

          {error === null ? (
            <View style={styles.progressCard}>
              {STEPS.map((label, index) => (
                <StepRow
                  key={label}
                  label={label}
                  isFinal={index === LAST_STEP}
                  state={
                    index < step
                      ? "done"
                      : index === step
                      ? "active"
                      : "hidden"
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>生成失敗</Text>

              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="重新嘗試"
                onPress={handleRetry}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>重新嘗試</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="返回修改設定"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>返回修改設定</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  safe: {
    flex: 1,
  },

  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  logo: {
    fontSize: 42,
    lineHeight: 50,
  },

  title: {
    marginTop: 26,
    color: C.text,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    color: C.textTertiary,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },

  progressCard: {
    width: "100%",
    maxWidth: 380,
    marginTop: 30,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 34,
  },

  stepMark: {
    width: 22,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  stepCheck: {
    color: C.success,
    fontSize: 15,
    fontWeight: "700",
  },

  stepText: {
    flex: 1,
    color: C.text,
    fontSize: 14.5,
    letterSpacing: -0.1,
  },

  stepTextDone: {
    color: C.textSecondary,
  },

  stepTextFinal: {
    color: C.text,
    fontWeight: "700",
  },

  errorCard: {
    width: "100%",
    maxWidth: 380,
    marginTop: 30,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.errorBorder,
    backgroundColor: C.errorBg,
  },

  errorTitle: {
    color: C.errorText,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  errorText: {
    marginTop: 8,
    color: C.errorText,
    fontSize: 13.5,
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },

  retryText: {
    color: C.white,
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  backButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.errorBorder,
  },

  backText: {
    color: C.errorText,
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
