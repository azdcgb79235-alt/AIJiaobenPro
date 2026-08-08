import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

type Props = {
  label: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
};

export default function FormPicker({
  label,
  value,
  items,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.box}>
        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(v)}
        >
          {items.map((item) => (
            <Picker.Item
              key={item}
              label={item}
              value={item}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 15,
  },

  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
});