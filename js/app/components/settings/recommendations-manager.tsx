import {
  Button,
  Dialog,
  Input,
  MenuContainer,
  MenuDraggableGroup,
  MenuGroup,
  MenuInfo,
  MenuItem,
  MenuSeparator,
  Text,
  zero,
} from "@streamplace/components";
import { usePDSAgent } from "@streamplace/components/src/streamplace-store/xrpc";
import Loading from "components/loading/loading";
import {
  Check,
  GripVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, View } from "react-native";

const { text, mt, mb, px, py, w, layout, gap, r, p } = zero;

interface ActorSearchResult {
  did: string;
  handle: string;
}

export default function RecommendationsManager() {
  const agent = usePDSAgent();
  const { theme } = zero.useTheme();
  const [streamers, setStreamers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isVisible: boolean;
    index: number | null;
  }>({ isVisible: false, index: null });
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ActorSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDebounceTimeout, setSearchDebounceTimeout] =
    useState<NodeJS.Timeout | null>(null);

  const { t } = useTranslation("settings");

  const loadRecommendations = async () => {
    if (!agent) return;

    try {
      setLoading(true);
      const userDID = agent.did;
      if (!userDID) {
        setStreamers([]);
        return;
      }

      // Get the record directly from the PDS for editing
      const response = await agent.com.atproto.repo.getRecord({
        repo: userDID,
        collection: "place.stream.live.recommendations",
        rkey: "self",
      });

      // todo: type this right
      let record = response.data.value as any;

      if (!response.success) {
        // Create a new empty record if not found
        const res = await agent.com.atproto.repo.createRecord({
          repo: userDID,
          collection: "place.stream.live.recommendations",
          record: {
            streamers: [],
            createdAt: new Date().toISOString(),
          },
        });
        if (!res.success) {
          throw new Error("Failed to create recommendations record");
        }
        record = res.data;
      }
      setStreamers(record.streamers || []);
    } catch (error: any) {
      console.error("Failed to load recommendations:", error);
      if (error.status !== 404) {
        Alert.alert(
          "Error",
          "Failed to load recommendations. Please try again.",
        );
      }
      setStreamers([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecommendations = async (newStreamers: string[]) => {
    if (!agent || saving) return;

    try {
      if (!agent.did) {
        throw new Error("User DID not found");
      }
      setSaving(true);

      // Use putRecord to create or update the record
      await agent.com.atproto.repo.putRecord({
        repo: agent.did,
        collection: "place.stream.live.recommendations",
        rkey: "self",
        record: {
          streamers: newStreamers,
          createdAt: new Date().toISOString(),
        },
      });

      setStreamers(newStreamers);
    } catch (error: any) {
      console.error("Failed to save recommendations:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save recommendations. Please try again.",
      );
      // Reload to get back to consistent state
      await loadRecommendations();
    } finally {
      setSaving(false);
    }
  };

  const searchActors = useCallback(
    async (query: string) => {
      if (!agent || !query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const response = await agent.place.stream.live.searchActorsTypeahead({
          q: query,
          limit: 10,
        });

        setSearchResults(
          response.data.actors.map((actor: any) => ({
            did: actor.did,
            handle: actor.handle,
          })),
        );
      } catch (error: any) {
        console.error("Failed to search actors:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    [agent],
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchDebounceTimeout) {
      clearTimeout(searchDebounceTimeout);
    }

    // Set new timeout for debounced search
    if (query.trim()) {
      const timeout = setTimeout(() => {
        searchActors(query);
      }, 300);
      setSearchDebounceTimeout(timeout);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectActor = async (actor: ActorSearchResult) => {
    if (streamers.length >= 8) {
      Alert.alert(
        "Maximum Reached",
        "You can only add up to 8 recommendations.",
      );
      return;
    }

    if (streamers.includes(actor.did)) {
      Alert.alert(
        "Already Added",
        "This streamer is already in your recommendations.",
      );
      return;
    }

    const newStreamers = [...streamers, actor.did];
    await saveRecommendations(newStreamers);

    // Clear search
    setSearchQuery("");
    setSearchResults([]);
  };

  const validateDID = (did: string, index: number): boolean => {
    const trimmed = did.trim();
    if (!trimmed) {
      setErrors((prev) => ({ ...prev, [index]: "DID is required" }));
      return false;
    }
    if (!trimmed.startsWith("did:")) {
      setErrors((prev) => ({
        ...prev,
        [index]: "DID must start with 'did:'",
      }));
      return false;
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
    return true;
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(streamers[index]);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setErrors({});
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null) return;

    const trimmed = editValue.trim();
    if (!trimmed) {
      setErrors({ [editingIndex]: "DID is required" });
      return;
    }
    if (!trimmed.startsWith("did:")) {
      setErrors({ [editingIndex]: "DID must start with 'did:'" });
      return;
    }

    const newStreamers = [...streamers];
    newStreamers[editingIndex] = trimmed;
    await saveRecommendations(newStreamers);
    setEditingIndex(null);
    setEditValue("");
    setErrors({});
  };

  const handleAddRecommendation = () => {
    if (streamers.length >= 8) {
      Alert.alert(
        "Maximum Reached",
        "You can only add up to 8 recommendations.",
      );
      return;
    }
    setStreamers([...streamers, ""]);
  };

  const handleDelete = (index: number) => {
    setDeleteDialog({ isVisible: true, index });
  };

  const confirmDelete = async () => {
    if (deleteDialog.index === null) return;

    const newStreamers = streamers.filter((_, i) => i !== deleteDialog.index);
    await saveRecommendations(newStreamers);
    setDeleteDialog({ isVisible: false, index: null });
  };

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newStreamers = [...streamers];
      const [movedItem] = newStreamers.splice(fromIndex, 1);
      newStreamers.splice(toIndex, 0, movedItem);
      setStreamers(newStreamers);
    },
    [streamers],
  );

  const handleDragEnd = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex !== toIndex) {
        const newStreamers = [...streamers];
        const [movedItem] = newStreamers.splice(fromIndex, 1);
        newStreamers.splice(toIndex, 0, movedItem);
        await saveRecommendations(newStreamers);
      }
    },
    [streamers, saveRecommendations],
  );

  useEffect(() => {
    if (!agent) return;
    loadRecommendations();
  }, [agent]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeout) {
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [searchDebounceTimeout]);

  if (!agent) {
    return <Loading />;
  }

  return (
    <>
      <ScrollView>
        <View style={[zero.layout.flex.align.center, zero.px[2], zero.py[2]]}>
          <View style={{ maxWidth: 800, width: "100%" }}>
            <MenuContainer>
              <View style={[mb[2]]}>
                <View
                  style={[
                    layout.flex.row,
                    layout.flex.justify.between,
                    layout.flex.alignCenter,
                  ]}
                >
                  <Text size="xl">{t("recommendations-to-others")}</Text>
                  <Button
                    onPress={loadRecommendations}
                    disabled={loading || saving}
                    leftIcon={<RefreshCw size={16} color={theme.colors.text} />}
                    size="pill"
                    width="min"
                    variant="secondary"
                  >
                    <Text size="sm">{t("refresh")}</Text>
                  </Button>
                </View>
              </View>

              <MenuInfo description={t("recommendations-description")} />
            </MenuContainer>

            {/* Search Bar */}
            {streamers.length < 8 && (
              <MenuContainer>
                <MenuGroup>
                  <View style={[px[3], py[2]]}>
                    <View
                      style={[
                        layout.flex.row,
                        layout.flex.alignCenter,
                        gap.all[2],
                      ]}
                    >
                      <Search size={20} color={theme.colors.textMuted} />
                      <Input
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholder="Search for streamers..."
                      />
                    </View>
                  </View>

                  {searching && (
                    <>
                      <MenuSeparator />
                      <View style={[py[2], layout.flex.center]}>
                        <Text
                          size="sm"
                          style={{ color: theme.colors.textMuted }}
                        >
                          Searching...
                        </Text>
                      </View>
                    </>
                  )}

                  {!searching && searchResults.length > 0 && (
                    <>
                      <MenuSeparator />
                      {searchResults.map((actor, index) => {
                        const alreadyAdded = streamers.includes(actor.did);
                        return (
                          <View key={actor.did}>
                            {index > 0 && <MenuSeparator />}
                            <Pressable
                              onPress={() =>
                                !alreadyAdded && handleSelectActor(actor)
                              }
                              disabled={alreadyAdded}
                            >
                              {({ pressed }) => (
                                <View
                                  style={[
                                    px[3],
                                    py[2],
                                    layout.flex.row,
                                    layout.flex.alignCenter,
                                    gap.all[2],
                                    r.md,
                                    {
                                      backgroundColor:
                                        pressed && !alreadyAdded
                                          ? "#ffffff08"
                                          : "transparent",
                                      opacity: alreadyAdded ? 0.5 : 1,
                                    },
                                  ]}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text>@{actor.handle}</Text>
                                  </View>
                                  {alreadyAdded && (
                                    <Text
                                      size="xs"
                                      style={{ color: theme.colors.textMuted }}
                                    >
                                      Added
                                    </Text>
                                  )}
                                </View>
                              )}
                            </Pressable>
                          </View>
                        );
                      })}
                    </>
                  )}

                  {!searching &&
                    searchQuery.trim() &&
                    searchResults.length === 0 && (
                      <>
                        <MenuSeparator />
                        <View style={[py[2], layout.flex.center]}>
                          <Text
                            size="sm"
                            style={{ color: theme.colors.textMuted }}
                          >
                            No results found
                          </Text>
                        </View>
                      </>
                    )}
                </MenuGroup>

                {searchQuery.trim() === "" && (
                  <MenuInfo description="Search for streamers by handle or name, or enter DIDs manually below" />
                )}
              </MenuContainer>
            )}

            {loading ? (
              <Loading />
            ) : (
              <MenuContainer>
                {streamers.length === 0 ? (
                  <MenuGroup>
                    <View style={[py[4], layout.flex.center]}>
                      <Text size="sm" style={{ color: theme.colors.textMuted }}>
                        {t("no-recommendations-yet")}
                      </Text>
                    </View>
                  </MenuGroup>
                ) : (
                  <MenuDraggableGroup
                    onMove={moveItem}
                    onDragEnd={handleDragEnd}
                    dragHandle={
                      <View style={{ padding: 4 }}>
                        <GripVertical
                          size={20}
                          color={theme.colors.textMuted}
                        />
                      </View>
                    }
                  >
                    {streamers.map((streamer, index) => (
                      <>
                        {index > 0 && <MenuSeparator key={`sep-${index}`} />}
                        <MenuItem key={index}>
                          {editingIndex === index ? (
                            <>
                              <View style={{ flex: 1 }}>
                                <Input
                                  value={editValue}
                                  onChangeText={setEditValue}
                                  placeholder="did:plc:..."
                                  autoFocus
                                />
                                {errors[index] && (
                                  <Text
                                    size="xs"
                                    style={{
                                      color: theme.colors.destructive,
                                      marginTop: 4,
                                    }}
                                  >
                                    {errors[index]}
                                  </Text>
                                )}
                              </View>

                              <Pressable
                                onPress={handleSaveEdit}
                                style={({ pressed }) => [
                                  {
                                    padding: 8,
                                    borderRadius: 6,
                                    backgroundColor: pressed
                                      ? "#ffffff08"
                                      : "transparent",
                                  },
                                ]}
                              >
                                <Check size={18} color={theme.colors.text} />
                              </Pressable>

                              <Pressable
                                onPress={handleCancelEdit}
                                style={({ pressed }) => [
                                  {
                                    padding: 8,
                                    borderRadius: 6,
                                    backgroundColor: pressed
                                      ? "#ffffff08"
                                      : "transparent",
                                  },
                                ]}
                              >
                                <X size={18} color={theme.colors.textMuted} />
                              </Pressable>
                            </>
                          ) : (
                            <>
                              <View style={{ flex: 1 }}>
                                <Text numberOfLines={1} ellipsizeMode="middle">
                                  {streamer}
                                </Text>
                              </View>

                              <Pressable
                                onPress={() => handleEdit(index)}
                                style={({ pressed }) => [
                                  {
                                    padding: 8,
                                    borderRadius: 6,
                                    backgroundColor: pressed
                                      ? "#ffffff08"
                                      : "transparent",
                                  },
                                ]}
                              >
                                <Pencil
                                  size={18}
                                  color={theme.colors.textMuted}
                                />
                              </Pressable>

                              <Pressable
                                onPress={() => handleDelete(index)}
                                style={({ pressed }) => [
                                  {
                                    padding: 8,
                                    borderRadius: 6,
                                    backgroundColor: pressed
                                      ? "#ffffff08"
                                      : "transparent",
                                  },
                                ]}
                              >
                                <X size={18} color={theme.colors.destructive} />
                              </Pressable>
                            </>
                          )}
                        </MenuItem>
                      </>
                    ))}
                  </MenuDraggableGroup>
                )}

                {streamers.length > 0 && streamers.length < 8 && (
                  <MenuSeparator />
                )}

                {streamers.length < 8 && (
                  <MenuGroup>
                    <Pressable onPress={handleAddRecommendation}>
                      {({ pressed }) => (
                        <View
                          style={[
                            px[3],
                            py[2],
                            layout.flex.row,
                            layout.flex.alignCenter,
                            gap.all[2],
                            r.md,
                            {
                              backgroundColor: pressed
                                ? "#ffffff08"
                                : "transparent",
                            },
                          ]}
                        >
                          <Plus size={20} color={theme.colors.text} />
                          <Text size="lg">Add DID manually</Text>
                        </View>
                      )}
                    </Pressable>
                  </MenuGroup>
                )}

                {saving && (
                  <View style={[mt[2], layout.flex.center]}>
                    <Text size="sm" style={{ color: theme.colors.textMuted }}>
                      {t("saving")}
                    </Text>
                  </View>
                )}
              </MenuContainer>
            )}
          </View>
        </View>
      </ScrollView>

      <Dialog
        open={deleteDialog.isVisible}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ isVisible: false, index: null })
        }
        title={t("delete")}
        dismissible={false}
      >
        <View style={[w.percent[100], mb[8], mt[2]]}>
          <Text style={[{ fontSize: 24 }]}>{t("confirm-delete")}</Text>
          <Text
            style={[text.gray[400], mt[4], { fontSize: 18, fontWeight: "700" }]}
          >
            {t("action-cannot-be-undone")}
          </Text>
        </View>

        <View style={[layout.flex.row, layout.flex.justify.end, gap.all[3]]}>
          <Button
            variant="secondary"
            width="full"
            onPress={() => setDeleteDialog({ isVisible: false, index: null })}
            disabled={saving}
          >
            <Text>{t("cancel")}</Text>
          </Button>
          <Button
            variant="destructive"
            width="full"
            onPress={confirmDelete}
            disabled={saving}
          >
            <Text style={[text.white, { fontSize: 14, fontWeight: "500" }]}>
              {saving ? t("deleting") : t("delete")}
            </Text>
          </Button>
        </View>
      </Dialog>
    </>
  );
}
