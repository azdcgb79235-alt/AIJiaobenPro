import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
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

import { useWorkspace } from "../context/WorkspaceContext";
import { Creator, Product } from "../types/workspace";

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

const INDUSTRIES = [
  "電商",
  "餐飲",
  "房仲",
  "保險",
  "汽車",
  "美容",
  "美髮",
  "健身",
  "科技",
  "教育",
  "旅遊",
  "金融",
  "服飾",
  "珠寶",
  "醫療",
  "寵物",
  "其他",
];

const AUDIENCES = [
  "大眾",
  "學生",
  "上班族",
  "創業者",
  "企業主",
  "家庭",
  "女性",
  "男性",
  "18-25歲",
  "26-35歲",
  "36-50歲",
  "50歲以上",
];

const PURPOSES = [
  "提升曝光",
  "增加成交",
  "增加私訊",
  "提升品牌",
  "導流官網",
  "增加粉絲",
  "增加分享",
  "增加收藏",
];

const STYLES = [
  "專業",
  "高級",
  "幽默",
  "故事型",
  "開箱",
  "教學",
  "知識型",
  "生活感",
  "電影感",
  "精品感",
];

const DURATIONS = ["15 秒", "30 秒", "45 秒", "60 秒", "90 秒"];

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

type SectionProps = {
  index: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
};

function Section({ index, label, hint, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionIndex}>{index}</Text>
        <Text style={styles.sectionLabel}>{label}</Text>
      </View>

      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}

      {children}
    </View>
  );
}

type ChipGroupProps = {
  items: string[];
  value: string;
  onChange: (next: string) => void;
};

function ChipGroup({ items, value, onChange }: ChipGroupProps) {
  return (
    <View style={styles.chipRow}>
      {items.map((item) => {
        const active = item === value;

        return (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={item}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item)}
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

function SelectCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectCard, selected && styles.selectCardActive]}
    >
      <Text style={styles.selectTitle}>{title}</Text>
      {subtitle ? <Text style={styles.selectSub}>{subtitle}</Text> : null}
    </Pressable>
  );
}

function formatCreatorBlock(creators: Creator[]) {
  return creators
    .map(
      (c, index) => `
角色${index + 1}：${c.name}
身分：${c.role || "未設定"}
個性：${c.personalities.join("、") || "未設定"}
說話風格：${c.speakingStyles.join("、") || "未設定"}
口頭禪：${c.catchphrases.join("、") || "未設定"}
`
    )
    .join("\n");
}

function formatProductBlock(product: Product) {
  return `
產品名稱：${product.name}
產品介紹：${product.intro}
產品特色：${product.features}
適合族群：${product.audience}
價格：${product.price}
優惠：${product.offer}
FAQ：${product.faq}
使用情境：${product.scenarios}
`;
}

export default function PromptScreen({ route, navigation }: any) {
  const platform: string = route?.params?.platform ?? "";
  const type: string = route?.params?.type ?? "";
  const {
    brand,
    products,
    creators,
    draft,
    saveDraft,
  } = useWorkspace();

  const continueDraft = Boolean(route?.params?.continueDraft);
  const needsTwoCreators = type === "口播模式";
  const needsOneCreator = type === "藏鏡人模式";

  const [productId, setProductId] = useState<string | null>(null);
  const [creatorIds, setCreatorIds] = useState<string[]>([]);
  const [extraDescription, setExtraDescription] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [duration, setDuration] = useState(DURATIONS[1]);

  // 預選產品：繼續草稿 > 唯一產品 > 上次草稿，讓生成更快可按
  useEffect(() => {
    setProductId((current) => {
      if (current && products.some((p) => p.id === current)) return current;
      if (continueDraft && draft?.productId) {
        const hit = products.find((p) => p.id === draft.productId);
        if (hit) return hit.id;
      }
      if (products.length === 1) return products[0].id;
      if (draft?.productId && products.some((p) => p.id === draft.productId)) {
        return draft.productId;
      }
      return null;
    });
  }, [products, draft, continueDraft]);

  // 預選角色：剛好 2／1 人時自動選；否則用草稿記得的選擇
  useEffect(() => {
    if (!needsTwoCreators && !needsOneCreator) {
      setCreatorIds([]);
      return;
    }

    setCreatorIds((current) => {
      const valid = current.filter((id) => creators.some((c) => c.id === id));
      if (needsTwoCreators && valid.length === 2) return valid;
      if (needsOneCreator && valid.length === 1) return valid;

      const draftIds = (draft?.creatorIds || []).filter((id) =>
        creators.some((c) => c.id === id)
      );

      if (needsTwoCreators) {
        if (continueDraft && draftIds.length === 2) return draftIds;
        if (creators.length === 2) return creators.map((c) => c.id);
        if (draftIds.length === 2) return draftIds;
        return valid;
      }

      if (continueDraft && draftIds.length >= 1) return [draftIds[0]];
      if (creators.length === 1) return [creators[0].id];
      if (draftIds.length >= 1) return [draftIds[0]];
      return valid;
    });
  }, [creators, draft, continueDraft, needsTwoCreators, needsOneCreator]);

  useEffect(() => {
    if (!continueDraft || !draft) return;
    if (draft.extraDescription) setExtraDescription(draft.extraDescription);
    if (draft.industry) setIndustry(draft.industry);
    if (draft.audience) setAudience(draft.audience);
    if (draft.purpose) setPurpose(draft.purpose);
    if (draft.style) setStyle(draft.style);
    if (draft.duration) setDuration(draft.duration);
  }, [draft, continueDraft]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const selectedCreators = useMemo(
    () => creators.filter((c) => creatorIds.includes(c.id)),
    [creators, creatorIds]
  );

  const creatorsOk = needsTwoCreators
    ? creatorIds.length === 2
    : needsOneCreator
      ? creatorIds.length === 1
      : true;

  const canGenerate = Boolean(selectedProduct) && creatorsOk;
  const trimmedExtra = extraDescription.trim();

  const blockHint = !selectedProduct
    ? products.length === 0
      ? "先建立產品"
      : "再選產品"
    : needsTwoCreators
      ? `再選 ${2 - creatorIds.length} 位角色`
      : needsOneCreator
        ? "再選受訪者"
        : "";

  function toggleCreator(id: string) {
    setCreatorIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (needsTwoCreators) {
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      }
      if (needsOneCreator) return [id];
      return prev;
    });
  }

  async function handleGenerate() {
    if (!canGenerate || !selectedProduct) return;

    await saveDraft({
      platform,
      type,
      productId: selectedProduct.id,
      creatorIds,
      purpose,
      style,
      duration,
      audience,
      industry,
      extraDescription: trimmedExtra,
    });

    let platformInstructions = "";
    if (platform === "全平台最佳化" || platform === "全平台爆款") {
      platformInstructions = `
【全平台最佳化要求】
- 同時考量 TikTok、Instagram Reels、Facebook Reels、YouTube Shorts
- 生成一份最適合跨平台發布的腳本
- 開場夠快、口語自然、結構清楚，各平台都能直接使用
`;
    }

    let typeInstructions = "";
    if (type === "口播模式" && selectedCreators.length === 2) {
      const [a, b] = selectedCreators;
      typeInstructions = `
【口播模式要求】
- 不是主持人、不是受訪者、不是採訪、不是街訪
- 兩位共同介紹商品的人一起聊天：${a.name}（${a.role || "角色"}）與 ${b.name}（${b.role || "角色"}）
- 兩人都在介紹商品，共同聊天、自然互動、自然吐槽、自然接話
- 不要有採訪感
- Script 請嚴格使用真實姓名對白，禁止使用 A：或 B：

${a.name}：
${b.name}：
${a.name}：
${b.name}：
`;
    } else if (type === "藏鏡人模式" && selectedCreators.length === 1) {
      const guest = selectedCreators[0];
      typeInstructions = `
【藏鏡人模式要求】
- 拍攝者不入鏡
- 拍攝者拿手機，一邊拍一邊與鏡頭中的人物互動
- 拍攝者負責提問，鏡頭人物回答
- 要有自然追問、互動、接話，營造真實感
- 要像街訪或開箱影片
- Script 請嚴格分成：

拍攝者：
${guest.name}：
拍攝者：
${guest.name}：
`;
    }

    const brandBlock = brand
      ? `
【品牌】
品牌名稱：${brand.name}
公司：${brand.company}
介紹：${brand.intro}
定位：${brand.positioning}
價值：${brand.values}
特色：${brand.features}
口號：${brand.slogan}
網址：${brand.website}
禁止事項：
${brand.prohibitions}

【品牌風格】
個性：${brand.style.personality}
語氣：${brand.style.tone}
CTA：${brand.style.cta}
Hashtag：${brand.style.hashtags}
`
      : "";

    const extraBlock =
      trimmedExtra !== ""
        ? `
補充說明：
${trimmedExtra}
`
        : "";

    const prompt = `
平台：${platform}
影片類型：${type}
AI 模式：爆款模式
影片目的：${purpose}
影片風格：${style}
影片長度：${duration}
行業：${industry}
目標客群：${audience}
${brandBlock}
【產品】
${formatProductBlock(selectedProduct)}
${selectedCreators.length ? `【角色】\n${formatCreatorBlock(selectedCreators)}` : ""}
${extraBlock}${platformInstructions}${typeInstructions}
請產生：

1. Hook
2. Script
3. CTA
4. Hashtags
5. Shot
`;

    navigation.navigate("Loading", {
      prompt,
      meta: {
        platform,
        type,
        productId: selectedProduct.id,
        creatorIds,
        title: selectedProduct.name,
      },
    });
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
            style={styles.scrollView}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.page}>
              <FadeIn delay={0}>
                <Text style={styles.title}>AI 腳本設定</Text>
                <Text style={styles.subtitle}>
                  選好產品就能生成，其餘可略過。
                </Text>

                {(platform !== "" || type !== "") && (
                  <View style={styles.contextRow}>
                    {platform !== "" && (
                      <View style={styles.contextChip}>
                        <Text style={styles.contextChipText}>{platform}</Text>
                      </View>
                    )}
                    {type !== "" && (
                      <View style={styles.contextChip}>
                        <Text style={styles.contextChipText}>{type}</Text>
                      </View>
                    )}
                  </View>
                )}
              </FadeIn>

              <FadeIn delay={70}>
                <Section
                  index={1}
                  label="選擇產品"
                  hint="點一下即可，不用重打商品資訊。"
                >
                  {products.length === 0 ? (
                    <Pressable
                      style={styles.linkCard}
                      onPress={() => navigation.navigate("Products")}
                    >
                      <Text style={styles.linkTitle}>尚未建立產品</Text>
                      <Text style={styles.linkDesc}>點此前往產品資料庫</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.selectList}>
                      {products.map((item) => (
                        <SelectCard
                          key={item.id}
                          title={item.name}
                          subtitle={item.intro || item.features}
                          selected={productId === item.id}
                          onPress={() => setProductId(item.id)}
                        />
                      ))}
                    </View>
                  )}
                </Section>
              </FadeIn>

              {(needsTwoCreators || needsOneCreator) && (
                <FadeIn delay={110}>
                  <Section
                    index={2}
                    label={needsTwoCreators ? "選擇兩位角色" : "選擇受訪者"}
                    hint={
                      needsTwoCreators
                        ? "選 2 人，對白用真實姓名。"
                        : "選鏡頭中的受訪者。"
                    }
                  >
                    {creators.length === 0 ? (
                      <Pressable
                        style={styles.linkCard}
                        onPress={() => navigation.navigate("Creators")}
                      >
                        <Text style={styles.linkTitle}>尚未建立角色</Text>
                        <Text style={styles.linkDesc}>點此前往創作者角色</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.selectList}>
                        {creators.map((item) => (
                          <SelectCard
                            key={item.id}
                            title={`${item.name}${item.role ? ` · ${item.role}` : ""}`}
                            subtitle={item.personalities.join("、")}
                            selected={creatorIds.includes(item.id)}
                            onPress={() => toggleCreator(item.id)}
                          />
                        ))}
                      </View>
                    )}
                  </Section>
                </FadeIn>
              )}

              <FadeIn delay={150}>
                <Section index={needsTwoCreators || needsOneCreator ? 3 : 2} label="行業">
                  <ChipGroup
                    items={INDUSTRIES}
                    value={industry}
                    onChange={setIndustry}
                  />
                </Section>
              </FadeIn>

              <FadeIn delay={180}>
                <Section index={needsTwoCreators || needsOneCreator ? 4 : 3} label="目標客群">
                  <ChipGroup
                    items={AUDIENCES}
                    value={audience}
                    onChange={setAudience}
                  />
                </Section>
              </FadeIn>

              <FadeIn delay={210}>
                <Section index={needsTwoCreators || needsOneCreator ? 5 : 4} label="影片目的">
                  <ChipGroup
                    items={PURPOSES}
                    value={purpose}
                    onChange={setPurpose}
                  />
                </Section>
              </FadeIn>

              <FadeIn delay={240}>
                <Section index={needsTwoCreators || needsOneCreator ? 6 : 5} label="影片風格">
                  <ChipGroup
                    items={STYLES}
                    value={style}
                    onChange={setStyle}
                  />
                </Section>
              </FadeIn>

              <FadeIn delay={270}>
                <Section index={needsTwoCreators || needsOneCreator ? 7 : 6} label="影片長度">
                  <ChipGroup
                    items={DURATIONS}
                    value={duration}
                    onChange={setDuration}
                  />
                </Section>
              </FadeIn>

              <FadeIn delay={300}>
                <Section
                  index={needsTwoCreators || needsOneCreator ? 8 : 7}
                  label="補充說明（選填）"
                >
                  <TextInput
                    value={extraDescription}
                    onChangeText={setExtraDescription}
                    placeholder="例如：要搞笑一點、強調優惠、控制 30 秒"
                    placeholderTextColor={C.textTertiary}
                    style={[styles.input, styles.inputMultiline]}
                    accessibilityLabel="補充說明"
                    multiline
                    textAlignVertical="top"
                  />
                </Section>
              </FadeIn>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            <View style={styles.bottomBarInner}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="開始 AI 生成"
                accessibilityState={{ disabled: !canGenerate }}
                disabled={!canGenerate}
                onPress={handleGenerate}
                style={[
                  styles.generateButton,
                  !canGenerate && styles.generateDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.generateText,
                    !canGenerate && styles.generateTextDisabled,
                  ]}
                >
                  開始 AI 生成
                </Text>
              </Pressable>

              {!canGenerate && blockHint ? (
                <Text style={styles.bottomHint}>{blockHint}</Text>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
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

  flex: {
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

  contextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  contextChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: C.surface,
  },

  contextChipText: {
    color: C.textSecondary,
    fontSize: 12.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  section: {
    marginTop: 30,
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sectionIndex: {
    width: 22,
    height: 22,
    borderRadius: 7,
    textAlign: "center",
    lineHeight: 22,
    overflow: "hidden",
    backgroundColor: C.surface,
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "700",
  },

  sectionLabel: {
    color: C.text,
    fontSize: 16.5,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  sectionHint: {
    marginTop: 7,
    color: C.textTertiary,
    fontSize: 13,
    lineHeight: 19,
  },

  input: {
    marginTop: 12,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    color: C.text,
    fontSize: 16,
  },

  inputMultiline: {
    height: 120,
    paddingTop: 14,
    paddingBottom: 14,
  },

  selectList: {
    marginTop: 12,
    gap: 8,
  },

  selectCard: {
    padding: 14,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },

  selectCardActive: {
    borderColor: C.black,
    backgroundColor: "#FAFAFB",
  },

  selectTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },

  selectSub: {
    marginTop: 4,
    color: C.textTertiary,
    fontSize: 12.5,
    lineHeight: 18,
  },

  linkCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 15,
    backgroundColor: C.surface,
  },

  linkTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },

  linkDesc: {
    marginTop: 4,
    color: C.textSecondary,
    fontSize: 13,
  },

  examples: {
    marginTop: 9,
    color: C.textTertiary,
    fontSize: 12.5,
  },

  chipRow: {
    marginTop: 12,
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

  generateButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 15,
    backgroundColor: C.black,
  },

  generateDisabled: {
    backgroundColor: C.disabled,
  },

  generateText: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  generateTextDisabled: {
    color: C.disabledText,
  },

  bottomHint: {
    marginTop: 9,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 12.5,
  },
});
