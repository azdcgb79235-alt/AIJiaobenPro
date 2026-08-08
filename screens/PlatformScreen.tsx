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

const FEATURED_PLATFORM = {
  icon: "⭐",
  name: "全平台最佳化",
  desc: "同時考量 TikTok、Reels、Shorts，產出最適合跨平台發布的腳本",
};

const PLATFORMS = [
  { icon: "🎵", name: "TikTok", desc: "短影音爆發流量" },
  { icon: "📸", name: "Instagram Reels", desc: "品牌經營最佳" },
  { icon: "📘", name: "Facebook Reels", desc: "社群曝光" },
  { icon: "▶️", name: "YouTube Shorts", desc: "長期累積觀看" },
  { icon: "📕", name: "小紅書", desc: "種草與分享" },
  { icon: "🧵", name: "Threads", desc: "快速互動討論" },
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
      duration: 460,
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

type PlatformCardProps = {
  icon: string;
  name: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
  featured?: boolean;
  badge?: string;
};

function PlatformCard({
  icon,
  name,
  desc,
  selected,
  onPress,
  featured = false,
  badge,
}: PlatformCardProps) {
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
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}，${desc}${badge ? `，${badge}` : ""}`}
        accessibilityState={{ selected }}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={[
          styles.card,
          featured && styles.cardFeatured,
          selected && styles.cardSelected,
        ]}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
            <Text style={styles.cardIconText}>{icon}</Text>
          </View>

          {badge ? (
            <View
              style={[
                styles.recommendBadge,
                selected && styles.recommendBadgeSelected,
              ]}
            >
              <Text style={styles.recommendBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.cardName, featured && styles.cardNameFeatured]}
          numberOfLines={2}
        >
          {name}
        </Text>

        <Text
          style={[styles.cardDesc, featured && styles.cardDescFeatured]}
          numberOfLines={featured ? 3 : 2}
        >
          {desc}
        </Text>

        {selected && (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function PlatformScreen({ navigation, route }: any) {
  const preset = route?.params?.platform as string | undefined;
  const [selected, setSelected] = useState<string | null>(
    preset || FEATURED_PLATFORM.name
  );

  const canContinue = selected !== null;

  function handleNext() {
    if (!selected) return;

    navigation.navigate("Type", {
      platform: selected,
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
              <Text style={styles.title}>選擇發布平台</Text>

              <Text style={styles.subtitle}>
                AI 會依照平台特性優化腳本。
              </Text>
            </FadeIn>

            <FadeIn delay={60} style={styles.featuredWrap}>
              <PlatformCard
                icon={FEATURED_PLATFORM.icon}
                name={FEATURED_PLATFORM.name}
                desc={FEATURED_PLATFORM.desc}
                selected={selected === FEATURED_PLATFORM.name}
                onPress={() => setSelected(FEATURED_PLATFORM.name)}
                featured
                badge="推薦"
              />
            </FadeIn>

            <View style={styles.grid}>
              {PLATFORMS.map((item, index) => (
                <FadeIn
                  key={item.name}
                  delay={120 + index * 50}
                  style={styles.gridItem}
                >
                  <PlatformCard
                    icon={item.icon}
                    name={item.name}
                    desc={item.desc}
                    selected={selected === item.name}
                    onPress={() => setSelected(item.name)}
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

  featuredWrap: {
    marginTop: 26,
    width: "100%",
  },

  grid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  gridItem: {
    width: "48%",
  },

  cardWrapper: {
    width: "100%",
  },

  card: {
    minHeight: 142,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  cardFeatured: {
    minHeight: 168,
    padding: 20,
    borderRadius: 20,
  },

  cardSelected: {
    borderColor: C.black,
    boxShadow: "0px 8px 22px rgba(16, 24, 40, 0.10)",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 28,
  },

  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },

  cardIconSelected: {
    backgroundColor: "#F0F0F2",
  },

  cardIconText: {
    fontSize: 19,
  },

  recommendBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: C.black,
  },

  recommendBadgeSelected: {
    marginRight: 26,
  },

  recommendBadgeText: {
    color: C.white,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  cardName: {
    marginTop: 14,
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  cardNameFeatured: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  cardDesc: {
    marginTop: 4,
    color: C.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
  },

  cardDescFeatured: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.textSecondary,
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
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 14,
  },

  nextButton: {
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
