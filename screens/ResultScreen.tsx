import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { useWorkspace } from "../context/WorkspaceContext";
import { generateScript } from "../services/api";

const C = {
  bg: "#FFFFFF",
  canvas: "#FAFAFB",
  surface: "#F6F6F7",
  border: "#ECECEF",
  borderSoft: "#F1F1F3",
  text: "#0B0B0F",
  textSecondary: "#6B6B73",
  textTertiary: "#9A9AA2",
  black: "#0B0B0F",
  white: "#FFFFFF",
  star: "#F5A524",
  starOff: "#E4E4E8",
  heart: "#E5484D",
  warnBg: "#FFFBEB",
  warnBorder: "#FDE68A",
  warnText: "#92400E",
};

const USE_NATIVE_DRIVER = Platform.OS !== "web";

const CARD_SHADOW: ViewStyle =
  Platform.OS === "web"
    ? ({
        boxShadow:
          "0 1px 2px rgba(11,11,15,0.04), 0 10px 30px rgba(11,11,15,0.05)",
      } as unknown as ViewStyle)
    : {
        shadowColor: "#0B0B0F",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
      };

const COPIED_MESSAGE = "已複製。";
const SHOOT_COPIED_MESSAGE = "已複製拍攝腳本";

function buildShootPrompt(script: string) {
  return `${script}

------------------------

你現在是一位專業短影音導演。

以下是我的完整腳本。

請不要修改內容。

直接規劃：

1.
影片總秒數

2.
每5秒要說什麼

3.
每段鏡位

4.
每段運鏡

5.
人物動作

6.
人物表情

7.
字幕

8.
B-roll

9.
轉場

10.
背景音樂

11.
拍攝注意事項

請輸出成：
可以直接拍攝的導演腳本。
------------------------`;
}

/* ------------------------------------------------------------------ */
/* 解析：AI 回覆內容與原始 prompt                                       */
/* ------------------------------------------------------------------ */

function getSection(source: string, title: string) {
  const regex = new RegExp(`【${title}】([\\s\\S]*?)(?=【|$)`, "i");
  const match = source.match(regex);

  return match ? match[1].trim() : "";
}

function parsePromptField(prompt: string, label: string) {
  const regex = new RegExp(`${label}[：:]\\s*(.+)`);
  const match = prompt.match(regex);

  return match ? match[1].trim() : "";
}

function parseHashtags(raw: string): string[] {
  if (!raw) return [];

  const hashed = raw.match(/#[^\s#,、，。\n]+/g);
  const source =
    hashed && hashed.length > 0
      ? hashed
      : raw
          .split(/[\s,、，\n]+/)
          .filter((t) => t.length > 0 && !/^[\d.、)）]+$/.test(t))
          .map((t) => (t.startsWith("#") ? t : `#${t}`));

  const seen: string[] = [];

  source.forEach((tag) => {
    const clean = tag.trim();

    if (clean.length > 1 && !seen.includes(clean)) seen.push(clean);
  });

  return seen;
}

/* ------------------------------------------------------------------ */
/* 本地品質分析：不額外呼叫 API，純粹依腳本內容做啟發式評估              */
/* ------------------------------------------------------------------ */

const HOOK_POWER_WORDS = [
  "別再",
  "竟然",
  "其實",
  "秘密",
  "免費",
  "只要",
  "千萬",
  "一定",
  "為什麼",
  "你知道",
  "原來",
  "居然",
  "不要",
  "最",
  "第一",
];

const CTA_ACTIONS = [
  "點",
  "留言",
  "私訊",
  "追蹤",
  "連結",
  "下單",
  "購買",
  "預約",
  "領取",
  "分享",
  "收藏",
  "報名",
  "加入",
  "洽詢",
  "搜尋",
];

const URGENCY_WORDS = [
  "今天",
  "現在",
  "立即",
  "限時",
  "最後",
  "只剩",
  "馬上",
  "本週",
  "今晚",
];

function clampScore(value: number) {
  return Math.max(1, Math.min(5, value));
}

function countChars(text: string) {
  return text.replace(/\s/g, "").length;
}

function scoreHook(hook: string) {
  if (!hook) return 1;

  const length = countChars(hook);
  let score = 2;

  if (length >= 6 && length <= 24) score += 2;
  else if (length <= 34) score += 1;

  if (/[？?！!]/.test(hook)) score += 1;
  if (/\d/.test(hook)) score += 1;
  if (HOOK_POWER_WORDS.some((word) => hook.includes(word))) score += 1;

  return clampScore(score);
}

function scoreCompleteness(parts: string[], script: string) {
  const present = parts.filter((part) => part.length > 0).length;
  let score = present;

  if (countChars(script) < 60) score -= 1;

  return clampScore(score);
}

function scoreConversion(cta: string, script: string) {
  if (!cta) return 1;

  let score = 2;

  if (CTA_ACTIONS.some((word) => cta.includes(word))) score += 2;
  if (URGENCY_WORDS.some((word) => cta.includes(word) || script.includes(word)))
    score += 1;
  if (countChars(cta) <= 30) score += 1;

  return clampScore(score);
}

/* ------------------------------------------------------------------ */
/* 拍攝建議：把 AI 的一段文字拆進四個面向                               */
/* ------------------------------------------------------------------ */

type ShotBucket = {
  key: string;
  emoji: string;
  title: string;
  keywords: string[];
};

const SHOT_BUCKETS: ShotBucket[] = [
  {
    key: "camera",
    emoji: "📷",
    title: "運鏡",
    keywords: [
      "運鏡",
      "鏡頭",
      "特寫",
      "近景",
      "中景",
      "遠景",
      "廣角",
      "空拍",
      "手持",
      "推近",
      "拉遠",
      "俯拍",
      "仰拍",
      "慢動作",
      "定格",
      "轉場",
      "剪輯",
      "分鏡",
      "畫面",
    ],
  },
  {
    key: "bgm",
    emoji: "🎵",
    title: "BGM",
    keywords: ["BGM", "bgm", "音樂", "配樂", "音效", "旋律", "節拍", "聲音"],
  },
  {
    key: "subtitle",
    emoji: "📝",
    title: "字幕",
    keywords: ["字幕", "字卡", "文字", "標題", "大字", "上字"],
  },
  {
    key: "technique",
    emoji: "🎬",
    title: "拍攝技巧",
    keywords: [],
  },
];

function splitShot(shot: string) {
  const buckets: Record<string, string[]> = {
    camera: [],
    bgm: [],
    subtitle: [],
    technique: [],
  };

  shot
    .split(/[。；;\n，,]/)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 1)
    .forEach((clause) => {
      const matched = SHOT_BUCKETS.find(
        (bucket) =>
          bucket.keywords.length > 0 &&
          bucket.keywords.some((keyword) => clause.includes(keyword))
      );

      buckets[matched ? matched.key : "technique"].push(clause);
    });

  return buckets;
}

function shotFallback(key: string, platform: string) {
  const fastPlatform =
    platform.includes("TikTok") ||
    platform.includes("小紅書") ||
    platform.includes("Reels") ||
    platform.includes("Shorts");

  if (key === "camera") {
    return "以產品特寫開場，中段切到使用情境的中景，結尾回到產品正面定格。";
  }

  if (key === "bgm") {
    return fastPlatform
      ? "選節奏偏快的熱門音樂，把剪點對在拍子上。"
      : "使用輕柔背景音樂，音量壓在人聲之下。";
  }

  if (key === "subtitle") {
    return "全程上字幕，關鍵數字與賣點放大並換色強調。";
  }

  return "使用自然光或柔光，背景保持乾淨，避免雜物入鏡。";
}

/* ------------------------------------------------------------------ */
/* AI 建議：依平台、長度、風格與本地評分推導                            */
/* ------------------------------------------------------------------ */

function platformAdvice(platform: string) {
  if (platform.includes("TikTok")) {
    return "使用快節奏剪輯，每 2 到 3 秒換一次畫面。";
  }

  if (platform.includes("Instagram")) {
    return "統一畫面色調，維持品牌視覺一致性。";
  }

  if (platform.includes("Facebook")) {
    return "務必上字幕，多數觀眾在靜音狀態下觀看。";
  }

  if (platform.includes("YouTube")) {
    return "前 5 秒就把主題講清楚，有利於長期被搜尋到。";
  }

  if (platform.includes("小紅書")) {
    return "把重點整理成畫面上的條列文字，方便被收藏。";
  }

  if (platform.includes("Threads")) {
    return "結尾丟出一個問題，帶動留言討論。";
  }

  return "開頭三秒決定留存率，先給結論再講原因。";
}

function buildSuggestions(
  platform: string,
  durationSec: number,
  hookScore: number,
  conversionScore: number,
  hashtagCount: number
) {
  const list: string[] = [
    "前 3 秒加入產品特寫，先讓觀眾知道你在賣什麼。",
    platformAdvice(platform),
  ];

  if (durationSec > 0) {
    list.push(`CTA 建議放在第 ${Math.max(5, durationSec - 4)} 秒。`);
  }

  if (hookScore <= 3) {
    list.push("Hook 可以再短一點，20 字內最容易被記住。");
  }

  if (conversionScore <= 3) {
    list.push("CTA 加入明確動作，例如「留言」或「點下方連結」。");
  }

  if (hashtagCount > 0 && hashtagCount < 8) {
    list.push("Hashtags 補到 8 至 10 個，提升被推薦的機會。");
  }

  return list.slice(0, 5);
}

/* ------------------------------------------------------------------ */
/* 元件                                                               */
/* ------------------------------------------------------------------ */

type CardProps = {
  emoji: string;
  title: string;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function Card({
  emoji,
  title,
  action,
  defaultOpen = true,
  children,
}: CardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rotate = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  useEffect(() => {
    const animation = Animated.timing(rotate, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    animation.start();

    return () => animation.stop();
  }, [open, rotate]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title}
          accessibilityState={{ expanded: open }}
          onPress={toggle}
          style={styles.cardHeaderMain}
        >
          <Text style={styles.cardEmoji}>{emoji}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </Pressable>

        {action}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? "收合" : "展開"}
          onPress={toggle}
          style={styles.chevronButton}
        >
          <Animated.Text
            style={[
              styles.chevron,
              {
                transform: [
                  {
                    rotate: rotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-90deg", "0deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            ▾
          </Animated.Text>
        </Pressable>
      </View>

      {open && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
}

type CopyButtonProps = {
  label?: string;
  onPress: () => void;
};

function CopyButton({ label = "複製", onPress }: CopyButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.copyButton}
    >
      <Text style={styles.copyButtonText}>{label}</Text>
    </Pressable>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Text
          key={index}
          style={[
            styles.star,
            index <= value ? styles.starOn : styles.starOffText,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

type ScoreRowProps = {
  label: string;
  value: number;
};

function ScoreRow({ label, value }: ScoreRowProps) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreLabel}>{label}</Text>

      <View style={styles.scoreRight}>
        <Stars value={value} />
        <Text style={styles.scoreValue}>{value}.0</Text>
      </View>
    </View>
  );
}

type ToolbarButtonProps = {
  emoji: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
};

function ToolbarButton({
  emoji,
  label,
  onPress,
  disabled = false,
  active = false,
}: ToolbarButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.toolButton, disabled && styles.toolButtonDisabled]}
    >
      <Text style={styles.toolEmoji}>{emoji}</Text>

      <Text
        style={[
          styles.toolLabel,
          active && styles.toolLabelActive,
          disabled && styles.toolLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* 畫面                                                               */
/* ------------------------------------------------------------------ */

export default function ResultScreen({ route, navigation }: any) {
  const {
    saveScript,
    toggleFavorite,
    clearDraft,
    getScript,
    updateScript,
  } = useWorkspace();

  const scriptIdParam: string | undefined = route?.params?.scriptId;
  const stored = scriptIdParam ? getScript(scriptIdParam) : undefined;

  const prompt: string = route?.params?.prompt ?? stored?.prompt ?? "";
  const initialResult: string = route?.params?.result ?? stored?.result ?? "";
  const initialElapsed: number =
    route?.params?.elapsedMs ?? stored?.elapsedMs ?? 0;
  const meta = route?.params?.meta as
    | {
        platform?: string;
        type?: string;
        productId?: string;
        creatorIds?: string[];
        title?: string;
      }
    | undefined;

  const [result, setResult] = useState(initialResult);
  const [elapsedMs, setElapsedMs] = useState(initialElapsed);
  const [regenerating, setRegenerating] = useState(false);
  const [scriptId, setScriptId] = useState<string | undefined>(scriptIdParam);
  const [favorite, setFavorite] = useState(Boolean(stored?.favorite));
  const [toast, setToast] = useState<string | null>(null);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const savedOnceRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (scriptIdParam || savedOnceRef.current) return;
    if (!result || !prompt) return;

    savedOnceRef.current = true;

    (async () => {
      const record = await saveScript({
        title: meta?.title || parsePromptField(prompt, "產品名稱") || "未命名腳本",
        prompt,
        result,
        platform: meta?.platform || parsePromptField(prompt, "平台") || "",
        type: meta?.type || parsePromptField(prompt, "影片類型") || "",
        productId: meta?.productId,
        creatorIds: meta?.creatorIds ?? [],
        status: "ready",
        favorite: false,
        elapsedMs,
      });
      if (mountedRef.current) setScriptId(record.id);
      await clearDraft();
    })();
  }, [
    clearDraft,
    elapsedMs,
    meta?.creatorIds,
    meta?.platform,
    meta?.productId,
    meta?.title,
    meta?.type,
    prompt,
    result,
    saveScript,
    scriptIdParam,
  ]);

  const showToast = useCallback(
    (message: string) => {
      setToast(message);

      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();

      if (toastTimer.current) clearTimeout(toastTimer.current);

      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start(() => {
          if (mountedRef.current) setToast(null);
        });
      }, 1600);
    },
    [toastOpacity]
  );

  const copy = useCallback(
    async (text: string, message: string = COPIED_MESSAGE) => {
      if (!text) return;

      await Clipboard.setStringAsync(text);
      showToast(message);
    },
    [showToast]
  );

  const parsed = useMemo(() => {
    const hook = getSection(result, "HOOK");
    const script = getSection(result, "SCRIPT");
    const cta = getSection(result, "CTA");
    const hashtagsRaw = getSection(result, "HASHTAGS");
    const shot = getSection(result, "SHOT");

    const hashtags = parseHashtags(hashtagsRaw);

    const platform = parsePromptField(prompt, "平台");
    const durationText = parsePromptField(prompt, "影片長度");
    const durationSec = parseInt(durationText.replace(/[^\d]/g, ""), 10) || 0;

    const hookScore = scoreHook(hook);
    const completenessScore = scoreCompleteness(
      [hook, script, cta, hashtagsRaw, shot],
      script
    );
    const conversionScore = scoreConversion(cta, script);

    return {
      hook,
      script,
      cta,
      shot,
      hashtags,
      platform,
      durationSec,
      hookScore,
      completenessScore,
      conversionScore,
      shotBuckets: splitShot(shot),
      suggestions: buildSuggestions(
        platform,
        durationSec,
        hookScore,
        conversionScore,
        hashtags.length
      ),
    };
  }, [prompt, result]);

  const isBroken = parsed.hook === "" && parsed.script === "";
  const canRegenerate = prompt !== "" && !regenerating;

  const handleRegenerate = useCallback(async () => {
    if (prompt === "" || regenerating) return;

    setRegenerating(true);

    const startedAt = Date.now();

    try {
      const data = await generateScript(prompt);

      if (!data || typeof data.result !== "string" || data.result === "") {
        throw new Error("empty");
      }

      if (!mountedRef.current) return;

      setResult(data.result);
      setElapsedMs(Date.now() - startedAt);
      showToast("已重新生成。");

      if (scriptId) {
        await updateScript(scriptId, { title: meta?.title });
        await saveScript({
          id: scriptId,
          title: meta?.title || "未命名腳本",
          prompt,
          result: data.result,
          platform: meta?.platform || "",
          type: meta?.type || "",
          productId: meta?.productId,
          creatorIds: meta?.creatorIds ?? [],
          status: "ready",
          favorite,
          elapsedMs: Date.now() - startedAt,
        });
      }
    } catch {
      if (!mountedRef.current) return;

      showToast("重新生成失敗，請稍後再試。");
    } finally {
      if (mountedRef.current) setRegenerating(false);
    }
  }, [
    favorite,
    meta?.creatorIds,
    meta?.platform,
    meta?.productId,
    meta?.title,
    meta?.type,
    prompt,
    regenerating,
    saveScript,
    scriptId,
    showToast,
    updateScript,
  ]);

  async function handleFavorite() {
    if (!scriptId) {
      setFavorite((prev) => !prev);
      showToast(favorite ? "已移除收藏。" : "已加入收藏。");
      return;
    }

    await toggleFavorite(scriptId);
    setFavorite((prev) => {
      const next = !prev;
      showToast(next ? "已加入收藏。" : "已移除收藏。");
      return next;
    });
  }

  const elapsedText =
    elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(1)} 秒` : "";

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
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>✨ AI 已完成腳本</Text>

                <Text style={styles.subtitle}>
                  你的內容已準備完成，可直接拍攝。
                </Text>
              </View>

              {elapsedText !== "" && (
                <View style={styles.timeBadge}>
                  <Text style={styles.timeLabel}>生成時間</Text>
                  <Text style={styles.timeValue}>{elapsedText}</Text>
                </View>
              )}
            </View>

            {isBroken ? (
              <View style={styles.brokenCard}>
                <Text style={styles.brokenTitle}>⚠️ AI 回傳格式異常</Text>

                <Text style={styles.brokenText}>
                  這次的回覆沒有包含可解析的腳本段落。重新生成通常就能修正，
                  或是回上一步調整設定後再試。
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="重新生成"
                  accessibilityState={{ disabled: !canRegenerate }}
                  disabled={!canRegenerate}
                  onPress={handleRegenerate}
                  style={[
                    styles.brokenPrimary,
                    !canRegenerate && styles.brokenPrimaryDisabled,
                  ]}
                >
                  <Text style={styles.brokenPrimaryText}>重新生成</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="返回修改"
                  onPress={() => navigation.goBack()}
                  style={styles.brokenSecondary}
                >
                  <Text style={styles.brokenSecondaryText}>返回修改</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Card
                  emoji="🎬"
                  title="完整腳本"
                  action={
                    <CopyButton
                      label="🎬 一鍵拍攝"
                      onPress={() =>
                        copy(
                          buildShootPrompt(parsed.script || result),
                          SHOOT_COPIED_MESSAGE
                        )
                      }
                    />
                  }
                >
                  <Text style={styles.bodyText}>{parsed.script}</Text>
                </Card>

                <Card
                  emoji="🎣"
                  title="Hook"
                  action={<CopyButton onPress={() => copy(parsed.hook)} />}
                >
                  <Text style={styles.hookText}>{parsed.hook}</Text>
                </Card>

                <Card
                  emoji="📢"
                  title="CTA"
                  action={<CopyButton onPress={() => copy(parsed.cta)} />}
                >
                  <Text style={styles.ctaText}>{parsed.cta}</Text>
                </Card>

                <Card
                  emoji="🏷"
                  title="Hashtags"
                  action={
                    <CopyButton
                      label="全部複製"
                      onPress={() => copy(parsed.hashtags.join(" "))}
                    />
                  }
                >
                  {parsed.hashtags.length > 0 ? (
                    <>
                      <View style={styles.tagWrap}>
                        {parsed.hashtags.map((tag) => (
                          <Pressable
                            key={tag}
                            accessibilityRole="button"
                            accessibilityLabel={`複製 ${tag}`}
                            onPress={() => copy(tag)}
                            style={styles.tag}
                          >
                            <Text style={styles.tagText}>{tag}</Text>
                          </Pressable>
                        ))}
                      </View>

                      <Text style={styles.tagHint}>
                        點擊單一標籤即可複製。
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.emptyText}>這次沒有取得 Hashtags。</Text>
                  )}
                </Card>

                <Card emoji="🎥" title="拍攝建議">
                  {SHOT_BUCKETS.map((bucket) => {
                    const lines = parsed.shotBuckets[bucket.key];
                    const content =
                      lines.length > 0
                        ? lines.map((line) => `${line}。`).join("")
                        : shotFallback(bucket.key, parsed.platform);

                    return (
                      <View key={bucket.key} style={styles.shotBlock}>
                        <Text style={styles.shotTitle}>
                          {bucket.emoji} {bucket.title}
                        </Text>

                        <Text style={styles.shotText}>{content}</Text>
                      </View>
                    );
                  })}
                </Card>

                <Card emoji="💡" title="AI 建議">
                  {parsed.suggestions.map((item) => (
                    <View key={item} style={styles.adviceRow}>
                      <Text style={styles.adviceDot}>•</Text>
                      <Text style={styles.adviceText}>{item}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={styles.toolbarInner}>
            <ToolbarButton
              emoji="📋"
              label="全部複製"
              onPress={() => copy(result)}
              disabled={result === ""}
            />

            <ToolbarButton
              emoji="🔄"
              label="再生成"
              onPress={handleRegenerate}
              disabled={!canRegenerate}
            />

            <ToolbarButton
              emoji={favorite ? "❤️" : "🤍"}
              label="收藏"
              onPress={handleFavorite}
              active={favorite}
            />

            <ToolbarButton
              emoji="🏠"
              label="回首頁"
              onPress={() => navigation.popToTop()}
            />
          </View>
        </View>
      </SafeAreaView>

      {toast !== null && (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, { opacity: toastOpacity }]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      {regenerating && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="small" color={C.text} />

            <Text style={styles.overlayText}>AI 正在重新打造腳本...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.canvas,
  },

  safe: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scroll: {
    alignItems: "center",
  },

  page: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: C.text,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 6,
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  timeBadge: {
    alignItems: "flex-end",
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: C.surface,
  },

  timeLabel: {
    color: C.textTertiary,
    fontSize: 10.5,
    letterSpacing: 0.1,
  },

  timeValue: {
    marginTop: 2,
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  card: {
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    ...CARD_SHADOW,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 13,
  },

  cardHeaderMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardEmoji: {
    fontSize: 15,
  },

  cardTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  chevronButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  chevron: {
    color: C.textTertiary,
    fontSize: 15,
    lineHeight: 18,
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  copyButton: {
    maxWidth: 168,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: C.surface,
  },

  copyButtonText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
  },

  scoreLabel: {
    color: C.textSecondary,
    fontSize: 14,
    letterSpacing: -0.1,
  },

  scoreRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  stars: {
    flexDirection: "row",
    gap: 1,
  },

  star: {
    fontSize: 14,
  },

  starOn: {
    color: C.star,
  },

  starOffText: {
    color: C.starOff,
  },

  scoreValue: {
    color: C.text,
    fontSize: 12.5,
    fontWeight: "700",
    width: 26,
    textAlign: "right",
  },

  platformBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: C.black,
  },

  platformBadgeText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  scoreNote: {
    marginTop: 10,
    color: C.textTertiary,
    fontSize: 11.5,
    lineHeight: 17,
  },

  hookText: {
    color: C.text,
    fontSize: 21,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.4,
  },

  bodyText: {
    color: C.text,
    fontSize: 15,
    lineHeight: 26,
    letterSpacing: -0.1,
  },

  ctaText: {
    color: C.text,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tag: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.canvas,
  },

  tagText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  tagHint: {
    marginTop: 11,
    color: C.textTertiary,
    fontSize: 11.5,
  },

  emptyText: {
    color: C.textTertiary,
    fontSize: 13.5,
  },

  shotBlock: {
    marginBottom: 14,
  },

  shotTitle: {
    color: C.text,
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  shotText: {
    marginTop: 5,
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 23,
  },

  adviceRow: {
    flexDirection: "row",
    gap: 9,
    paddingVertical: 5,
  },

  adviceDot: {
    color: C.textTertiary,
    fontSize: 14,
    lineHeight: 22,
  },

  adviceText: {
    flex: 1,
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  brokenCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.warnBorder,
    backgroundColor: C.warnBg,
  },

  brokenTitle: {
    color: C.warnText,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  brokenText: {
    marginTop: 9,
    color: C.warnText,
    fontSize: 13.5,
    lineHeight: 21,
  },

  brokenPrimary: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.black,
  },

  brokenPrimaryDisabled: {
    backgroundColor: C.starOff,
  },

  brokenPrimaryText: {
    color: C.white,
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  brokenSecondary: {
    marginTop: 10,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.warnBorder,
    backgroundColor: C.white,
  },

  brokenSecondaryText: {
    color: C.warnText,
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  toolbar: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
    backgroundColor: C.bg,
  },

  toolbarInner: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },

  toolButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },

  toolButtonDisabled: {
    opacity: 0.4,
  },

  toolEmoji: {
    fontSize: 19,
    lineHeight: 24,
  },

  toolLabel: {
    marginTop: 3,
    color: C.textSecondary,
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  toolLabelActive: {
    color: C.heart,
  },

  toolLabelDisabled: {
    color: C.textTertiary,
  },

  toast: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 104,
    alignItems: "center",
  },

  toastText: {
    overflow: "hidden",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: C.black,
    color: C.white,
    fontSize: 13.5,
    fontWeight: "600",
    letterSpacing: -0.1,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.82)",
  },

  overlayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    ...CARD_SHADOW,
  },

  overlayText: {
    color: C.text,
    fontSize: 14.5,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
