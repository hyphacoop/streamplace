import { useNavigation } from "@react-navigation/native";
import { RefreshCcw, X } from "@tamagui/lucide-icons";
import AQLink from "components/aqlink";
import Loading from "components/loading/loading";
import {
  deleteStreamKeyRecord,
  getStreamKeyRecords,
  selectKeyRecords,
} from "features/bluesky/blueskySlice";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { PlaceStreamKey } from "streamplace";
import {
  Button,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import { timeAgo } from "utils/timeAgo";

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
    <XStack
      justifyContent="space-between"
      alignItems="stretch"
      gap="$4"
      opacity={isDeleting ? 0.5 : 1}
      pointerEvents={isDeleting ? "none" : "auto"}
      position="relative"
    >
      <View
        flexDirection="row"
        $xs={{ flexDirection: "column", marginBottom: "$4" }}
        gap="$2"
      >
        {keyRecord?.signingKey && (
          <Text
            fontFamily="$mono"
            fontSize="$2"
            $xs={{ width: "$14" }}
            ellipse
            numberOfLines={1}
          >
            {keyRecord?.signingKey}
          </Text>
        )}
        {keyRecord?.createdAt && (
          <Text fontSize="$2" f={1}>
            made {timeAgo(new Date(keyRecord.createdAt))}
          </Text>
        )}
      </View>
      <Button
        aria-label="Delete"
        size="$3"
        aspectRatio={1 / 1}
        padding="$2"
        hoverStyle={{ backgroundColor: "#f46" }}
        onPress={() => deleteKeyRecord(rkey)}
        disabled={isDeleting}
      >
        {isDeleting ? <Spinner size="small" /> : <X />}
      </Button>
    </XStack>
  );
}

export default function KeyManager() {
  const dispatch = useAppDispatch();
  const keyObj = useAppSelector(selectKeyRecords);
  const keyRecords = keyObj?.records || null;
  const navigation = useNavigation();

  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const deleteKeyRecord = (rkey: string) => {
    if (deletingKeys.has(rkey)) return; // Prevent double deletes
    setDeletingKeys((prev) => new Set(prev).add(rkey));
    dispatch(deleteStreamKeyRecord({ rkey })).finally(() => {
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
      dispatch(getStreamKeyRecords());
    }, 500);
  }, []);

  navigation.setOptions({ title: `Key Manager` });

  return (
    <ScrollView justifyContent="flex-start" alignItems="center">
      <YStack f={1} p="$4" gap="$4" maxWidth={650}>
        {keyRecords === null || keyObj === null ? (
          <Loading />
        ) : keyRecords.records.length === 0 ? (
          <>
            <Text mt="$8">No keys here!</Text>
            <AQLink to={{ screen: "LiveDashboard" }}>
              <Text fontSize="$2" color="$color.blue7Light">
                Go to the live dashboard to create a key.
              </Text>
            </AQLink>
            <Button
              aria-label="Refresh"
              size="$3"
              padding="$2"
              onPress={() => dispatch(getStreamKeyRecords())}
            >
              <RefreshCcw />
            </Button>
          </>
        ) : keyObj.loading == true || keyRecords === null ? (
          <Loading />
        ) : keyRecords.records.length === 0 ? (
          <>
            <Text mt="$8">No keys here!</Text>
            <AQLink to={{ screen: "LiveDashboard" }}>
              <Text fontSize="$2" color="$color.blue7Light">
                Go to the live dashboard to create a key.
              </Text>
            </AQLink>
          </>
        ) : (
          <>
            <YStack
              gap="$2"
              borderBottomWidth={1}
              borderBottomColor="$color.gray3Dark"
              pb="$2"
              mb="$2"
            >
              <YStack
                gap="$2"
                borderBottomWidth={1}
                borderBottomColor="$color.gray3Dark"
                pb="$2"
                mb="$2"
              >
                <Text fontSize="$8">Your Stream Pubkeys</Text>
                <Text fontSize="$2" color="$color.gray11Dark">
                  A pubkey is a pair to one of your stream keys. You can revoke
                  access for a specific stream key by revoking its associated
                  pubkey below.
                </Text>
              </YStack>
              <YStack gap="$2">
                {keyRecords.records.map((keyRecord) => {
                  const rkey = keyRecord.uri.split("/").pop() as string;
                  return (
                    <KeyRow
                      rkey={rkey}
                      keyRecord={keyRecord.value as any}
                      deleteKeyRecord={deleteKeyRecord}
                      isDeleting={deletingKeys.has(rkey)}
                    />
                  );
                })}
              </YStack>
              <Text fontSize="$2" color="$color.gray11Dark">
                {keyRecords.records.length} key
                {keyRecords.records.length > 1 && "s"}
              </Text>
            </YStack>

            <Text fontSize="$2" color="$color.gray11Dark">
              Go to the live dashboard to create a key.
            </Text>
          </>
        )}
      </YStack>
    </ScrollView>
  );
}
