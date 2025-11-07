import { useNavigation } from "@react-navigation/native";
import AQLink from "components/aqlink";
import Loading from "components/loading/loading";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useStore } from "store";
import { useKeyRecords } from "store/hooks";
import { PlaceStreamKey } from "streamplace";
import { timeAgo } from "utils/timeAgo";

import { Text } from "@streamplace/components";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

function KeyRow({
  keyRecord,
  rkey,
  deleteKeyRecord,
  isDeleting,
}: {
  keyRecord: PlaceStreamKey.Record;
  rkey: string;
  deleteKeyRecord: (rkey: string) => void;
  isDeleting: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          opacity: isDeleting ? 0.5 : 1,
          pointerEvents: isDeleting ? "none" : "auto",
        },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        {keyRecord?.signingKey && (
          <Text
            style={[
              {
                fontFamily: "monospace",
                fontSize: 12,
                color: "#fff",
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {keyRecord?.signingKey}
          </Text>
        )}
        {keyRecord?.createdAt && (
          <Text style={[{ fontSize: 12, color: "#999" }]}>
            made {timeAgo(new Date(keyRecord.createdAt))}{" "}
            {keyRecord.createdBy && "by " + keyRecord.createdBy}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          {
            width: 30,
            height: 30,
            padding: 8,
            backgroundColor: isDeleting ? "#666" : "#333",
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={() => deleteKeyRecord(rkey)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <X size={16} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function KeyManager() {
  const deleteStreamKeyRecord = useStore(
    (state) => state.deleteStreamKeyRecord,
  );
  const getStreamKeyRecords = useStore((state) => state.getStreamKeyRecords);
  const keyObj = useKeyRecords();
  const keyRecords = keyObj?.records || null;
  const navigation = useNavigation();
  const { t } = useTranslation("settings");

  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const deleteKeyRecord = (rkey: string) => {
    if (deletingKeys.has(rkey)) return; // Prevent double deletes
    setDeletingKeys((prev) => new Set(prev).add(rkey));
    deleteStreamKeyRecord(rkey).finally(() => {
      setDeletingKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rkey);
        return newSet;
      });
    });
  };

  useEffect(() => {
    // delay 500ms to allow the screen to render
    setTimeout(() => {
      getStreamKeyRecords();
    }, 500);
  }, []);

  navigation.setOptions({ title: t("key-manager") });

  return (
    <ScrollView
      contentContainerStyle={[
        { justifyContent: "flex-start" },
        { alignItems: "center" },
      ]}
    >
      <View style={[{ flex: 1 }, { padding: 16, gap: 16, maxWidth: 650 }]}>
        {keyRecords === null || keyObj === null ? (
          <Loading />
        ) : keyRecords.records.length === 0 ? (
          <>
            <Text style={[{ marginTop: 32, fontSize: 16, color: "#fff" }]}>
              {t("no-keys")}
            </Text>
            <AQLink to={{ screen: "LiveDashboard" }}>
              <Text style={[{ fontSize: 12, color: "#007AFF" }]}>
                {t("go-to-dashboard")}
              </Text>
            </AQLink>
            <TouchableOpacity
              style={[
                {
                  width: 32,
                  height: 32,
                  padding: 8,
                  backgroundColor: "#333",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={() => getStreamKeyRecords()}
            >
              <Text style={[{ fontSize: 16, color: "#fff" }]}>
                {t("refresh")}
              </Text>
            </TouchableOpacity>
          </>
        ) : keyObj.loading == true || keyRecords === null ? (
          <Loading />
        ) : keyRecords.records.length === 0 ? (
          <>
            <Text style={[{ marginTop: 32, fontSize: 16, color: "#fff" }]}>
              {t("no-keys")}
            </Text>
            <AQLink to={{ screen: "LiveDashboard" }}>
              <Text style={[{ fontSize: 12, color: "#007AFF" }]}>
                {t("go-to-dashboard")}
              </Text>
            </AQLink>
          </>
        ) : (
          <>
            <View
              style={[
                {
                  gap: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#333",
                  paddingBottom: 8,
                  marginBottom: 8,
                },
              ]}
            >
              <View
                style={[
                  {
                    gap: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: "#333",
                    paddingBottom: 8,
                    marginBottom: 8,
                  },
                ]}
              >
                <Text
                  style={[{ fontSize: 32, fontWeight: "bold", color: "#fff" }]}
                >
                  {t("your-stream-pubkeys")}
                </Text>
                <Text style={[{ fontSize: 12, color: "#999" }]}>
                  {t("pubkey-description")}
                </Text>
              </View>
              <View style={[{ gap: 8 }]}>
                {keyRecords.records.map((keyRecord) => {
                  const rkey = keyRecord.uri.split("/").pop() as string;
                  return (
                    <KeyRow
                      key={rkey}
                      rkey={rkey}
                      keyRecord={keyRecord.value as any}
                      deleteKeyRecord={deleteKeyRecord}
                      isDeleting={deletingKeys.has(rkey)}
                    />
                  );
                })}
              </View>
              <Text style={[{ fontSize: 12, color: "#999" }]}>
                {t("keys-count", { count: keyRecords.records.length })}
              </Text>
            </View>

            <Text style={[{ fontSize: 12, color: "#999" }]}>
              {t("go-to-dashboard")}
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}
