import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  bg: "#FFFFFF",
  surface: "#F6F6F7",
  border: "#ECECEF",
  borderSoft: "#F1F1F3",
  text: "#0B0B0F",
  textSecondary: "#6B6B73",
  textTertiary: "#9A9AA2",
  black: "#0B0B0F",
  white: "#FFFFFF",
  disabled: "#E8E8EB",
  disabledText: "#A8A8AF",
};

const VIDEO_TYPES = [
  {
    icon: "🎙️",
    title: "口播模式",
    desc: "兩人共同介紹，自然聊天",
  },
  {
    icon: "📱",
    title: "藏鏡人模式",
    desc: "拍攝者不入鏡，邊拍邊互動",
  },
  { icon: "📦", title: "商品開箱", desc: "最適合新品介紹" },
  { icon: "🎓", title: "教學分享", desc: "提升專業形象" },
  { icon: "📖", title: "品牌故事", desc: "建立品牌信任" },
  { icon: "🔥", title: "爆款推薦", desc: "快速吸引觀看" },
  { icon: "💬", title: "常見問題", desc: "解決客戶疑問" },
  { icon: "📊", title: "排行榜", desc: "提高觀看率" },
  { icon: "⚖️", title: "前後對比", desc: "最容易成交" },
  { icon: "🎥", title: "幕後花絮", desc: "增加品牌真實感" },
  { icon: "🛒", title: "商品推薦", desc: "導購最佳" },
  { icon: "✨", title: "使用心得", desc: "建立信任感" },
];

const USE_NATIVE_DRIVER = Platform.OS !== "web";

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
      duration: 440,
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
                outputRange: [12, 0],
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

type TypeCardProps = {
  icon: string;
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
};

function TypeCard({ icon, title, desc, selected, onPress }: TypeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      speed: 45,
      bounciness: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}，${desc}`}
        accessibilityState={{ selected }}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
          <Text style={styles.cardIconText}>{icon}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>

        {selected && (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function TypeScreen({ route, navigation }: any) {
  const platform: string = route?.params?.platform ?? "";
  const draftType: string | undefined = route?.params?.type;

  const [selected, setSelected] = useState<string | null>(draftType ?? null);

  const canContinue = selected !== null;

  function handleNext() {
    if (!selected) return;

    navigation.navigate("Prompt", {
      platform: platform,
      type: selected,
      continueDraft: route?.params?.continueDraft,
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <FadeIn delay={0}>
              <Text style={styles.title}>選擇影片類型</Text>

              <Text style={styles.subtitle}>
                不同影片類型，AI 會使用不同腳本架構。
              </Text>

              {platform !== "" && (
                <View style={styles.platformChip}>
                  <Text style={styles.platformChipText}>{platform}</Text>
                </View>
              )}
            </FadeIn>

            <View style={styles.list}>
              {VIDEO_TYPES.map((item, index) => (
                <FadeIn key={item.title} delay={70 + index * 35}>
                  <TypeCard
                    icon={item.icon}
                    title={item.title}
                    desc={item.desc}
                    selected={selected === item.title}
                    onPress={() => setSelected(item.title)}
                  />
                </FadeIn>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="上一步"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>上一步</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="下一步"
              accessibilityState={{ disabled: !canContinue }}
              disabled={!canContinue}
              onPress={handleNext}
              style={[styles.nextButton, !canContinue && styles.nextDisabled]}
            >
              <Text
                style={[
                  styles.nextText,
                  !canContinue && styles.nextTextDisabled,
                ]}
              >
                下一步
              </Text>
            </Pressable>
          </View>
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

  scrollView: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    alignItems: "center",
  },

  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },

  title: {
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 8,
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: -0.1,
  },

  platformChip: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: C.surface,
  },

  platformChipText: {
    color: C.textSecondary,
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  list: {
    marginTop: 22,
    gap: 10,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    paddingRight: 44,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  cardSelected: {
    borderColor: C.black,
    boxShadow: "0px 6px 18px rgba(16, 24, 40, 0.09)",
  },

  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  cardIconSelected: {
    backgroundColor: "#F0F0F2",
  },

  cardIconText: {
    fontSize: 20,
  },

  cardBody: {
    flex: 1,
  },

  cardTitle: {
    color: C.text,
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  cardDesc: {
    marginTop: 3,
    color: C.textTertiary,
    fontSize: 13,
    lineHeight: 19,
  },

  check: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },

  checkMark: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },

  bottomBar: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    backgroundColor: C.bg,
  },

  bottomBarInner: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 14,
  },

  backButton: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  backText: {
    color: C.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },

  nextDisabled: {
    backgroundColor: C.disabled,
  },

  nextText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  nextTextDisabled: {
    color: C.disabledText,
  },
});
