import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSites, selectSite } from '../../features/sites/sitesSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';

const BG = '#050a14';
const CARD = '#0d1526';
const ACCENT = '#38bdf8';

export const APP_HORIZONTAL_PADDING = '$4';

const HEADER_ROW_MIN_H = 44;
const ACTION_HIT = 40;
const MENU_WIDTH = 228;
const MENU_RADIUS = 16;
const SITE_MENU_WIDTH = 300;
const SITE_MENU_MAX_H = 360;
/** Extra top inset under status bar (Gluestack `$3` ≈ 12). */
const HEADER_PADDING_TOP_EXTRA = 12;

export type AppHeaderProps = {
  onPressAdd?: () => void;
  onPressShare?: () => void;
  onPressProfile?: () => void;
  onMenuProfile?: () => void;
  onMenuLogout?: () => void;
  profileMenuHighlightProfile?: boolean;
  notificationCount?: number;
};

type AnchorRect = { x: number; y: number; width: number; height: number };

export default function AppHeader({
  onPressProfile,
  onMenuProfile,
  onMenuLogout,
  profileMenuHighlightProfile,
  notificationCount = 10,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items: sites, selectedSiteName, selectedSiteId, status: sitesStatus } = useAppSelector(
    (s) => s.sites,
  );

  const profileAnchorRef = useRef<View>(null);
  const siteAnchorRef = useRef<View>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sitePickerOpen, setSitePickerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<AnchorRect | null>(null);
  const [siteAnchor, setSiteAnchor] = useState<AnchorRect | null>(null);

  const hasProfileMenu = Boolean(onMenuProfile && onMenuLogout);

  useEffect(() => {
    void dispatch(fetchSites());
  }, [dispatch]);

  const openProfileMenu = useCallback(() => {
    profileAnchorRef.current?.measureInWindow((x, y, w, h) => {
      setProfileAnchor({ x, y, width: w, height: h });
      setProfileMenuOpen(true);
    });
  }, []);

  const openSitePicker = useCallback(() => {
    siteAnchorRef.current?.measureInWindow((x, y, w, h) => {
      setSiteAnchor({ x, y, width: w, height: h });
      setSitePickerOpen(true);
    });
  }, []);

  const closeProfileMenu = useCallback(() => setProfileMenuOpen(false), []);
  const closeSitePicker = useCallback(() => setSitePickerOpen(false), []);

  const onProfileIconPress = useCallback(() => {
    if (hasProfileMenu) {
      openProfileMenu();
      return;
    }
    onPressProfile?.();
  }, [hasProfileMenu, onPressProfile, openProfileMenu]);

  const windowW = Dimensions.get('window').width;

  const profileMenuLeft =
    profileAnchor != null
      ? Math.max(12, Math.min(profileAnchor.x + profileAnchor.width - MENU_WIDTH, windowW - MENU_WIDTH - 12))
      : 12;
  const profileMenuTop =
    profileAnchor != null
      ? profileAnchor.y + profileAnchor.height + 6
      : insets.top + HEADER_PADDING_TOP_EXTRA + HEADER_ROW_MIN_H + 8;

  const siteMenuW = Math.min(SITE_MENU_WIDTH, windowW - 24);
  /** Align dropdown under pill’s left edge (not right-shifted). */
  const siteMenuLeft =
    siteAnchor != null
      ? Math.max(12, Math.min(siteAnchor.x, windowW - siteMenuW - 12))
      : 12;
  const siteMenuTop =
    siteAnchor != null
      ? siteAnchor.y + siteAnchor.height + 6
      : insets.top + HEADER_PADDING_TOP_EXTRA + HEADER_ROW_MIN_H + 8;

  return (
    <Box
      px={APP_HORIZONTAL_PADDING}
      pb="$3"
      bg={BG}
      style={{ paddingTop: insets.top + HEADER_PADDING_TOP_EXTRA }}
    >
      <HStack
        alignItems="center"
        justifyContent="space-between"
        minHeight={HEADER_ROW_MIN_H}
        space="sm"
        alignSelf="stretch"
      >
        <View
          ref={siteAnchorRef}
          collapsable={false}
          style={{ flexShrink: 1, flexGrow: 0, maxWidth: '70%', alignItems: 'flex-start' }}
        >
          <Pressable
            flexDirection="row"
            alignItems="center"
            justifyContent="flex-start"
            minHeight={ACTION_HIT}
            alignSelf="flex-start"
            bg={CARD}
            px="$3"
            borderRadius="$full"
            maxWidth="100%"
            onPress={openSitePicker}
          >
            {sitesStatus === 'loading' ? (
              <ActivityIndicator size="small" color={ACCENT} style={{ marginRight: 8 }} />
            ) : null}
            <Text
              color="$white"
              fontWeight="$medium"
              mr="$1"
              numberOfLines={1}
              ellipsizeMode="tail"
              flexShrink={1}
            >
              {selectedSiteName}
            </Text>
            <Box flexShrink={0} justifyContent="center">
              <Ionicons name="chevron-down" size={18} color="#fff" />
            </Box>
          </Pressable>
        </View>

        <HStack space="xs" alignItems="center" justifyContent="center" flexShrink={0} alignSelf="center">
          <Pressable
            w={ACTION_HIT}
            h={ACTION_HIT}
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
          >
            <Ionicons name="notifications-outline" size={22} color="#e2e8f0" />
            <Box
              position="absolute"
              top={4}
              right={4}
              bg="#ef4444"
              minWidth={18}
              h={18}
              borderRadius={9}
              alignItems="center"
              justifyContent="center"
              px="$1"
            >
              <Text color="$white" fontSize={10} fontWeight="$bold">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </Box>
          </Pressable>

          <View ref={profileAnchorRef} collapsable={false}>
            <Pressable
              w={ACTION_HIT}
              h={ACTION_HIT}
              borderRadius={ACTION_HIT / 2}
              bg={CARD}
              borderWidth={1}
              borderColor={ACCENT}
              alignItems="center"
              justifyContent="center"
              alignSelf="center"
              onPress={onProfileIconPress}
            >
              <Ionicons name="person-outline" size={20} color={ACCENT} />
            </Pressable>
          </View>
        </HStack>
      </HStack>

      {/* Site picker — GET /sites/paged (Bearer from apiClient) */}
      <Modal visible={sitePickerOpen} transparent animationType="fade" onRequestClose={closeSitePicker}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <RNPressable style={styles.backdrop} onPress={closeSitePicker} accessibilityRole="button" />
          <View
            style={[
              styles.siteMenuWrap,
              {
                top: siteMenuTop,
                left: siteMenuLeft,
                width: siteMenuW,
                maxHeight: SITE_MENU_MAX_H,
              },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.siteMenu}>
              <RNText style={styles.siteMenuTitle}>Sites</RNText>
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.siteScroll}>
                <RNPressable
                  onPress={() => {
                    dispatch(selectSite({ id: null, name: 'All Sites' }));
                    closeSitePicker();
                  }}
                  style={[styles.siteRow, !sites.length ? styles.siteRowLast : undefined]}
                >
                  <RNText
                    style={[
                      styles.siteRowText,
                      selectedSiteId === null ? styles.siteRowTextActive : undefined,
                    ]}
                    numberOfLines={1}
                  >
                    All Sites
                  </RNText>
                  {selectedSiteId === null ? (
                    <Ionicons name="checkmark" size={18} color={ACCENT} />
                  ) : null}
                </RNPressable>
                {sites.map((site, index) => (
                  <RNPressable
                    key={site.id}
                    onPress={() => {
                      dispatch(selectSite({ id: site.id, name: site.name }));
                      closeSitePicker();
                    }}
                    style={[
                      styles.siteRow,
                      index === sites.length - 1 ? styles.siteRowLast : undefined,
                    ]}
                  >
                    <RNText
                      style={[
                        styles.siteRowText,
                        selectedSiteId === site.id ? styles.siteRowTextActive : undefined,
                      ]}
                      numberOfLines={1}
                    >
                      {site.name}
                    </RNText>
                    {selectedSiteId === site.id ? (
                      <Ionicons name="checkmark" size={18} color={ACCENT} />
                    ) : null}
                  </RNPressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={profileMenuOpen} transparent animationType="fade" onRequestClose={closeProfileMenu}>
        <View style={styles.modalRoot} pointerEvents="box-none">
          <RNPressable style={styles.backdrop} onPress={closeProfileMenu} accessibilityRole="button" />
          <View
            style={[styles.menuWrap, { top: profileMenuTop, left: profileMenuLeft, width: MENU_WIDTH }]}
            pointerEvents="box-none"
          >
            <View style={styles.menu}>
              <RNPressable
                onPress={() => {
                  closeProfileMenu();
                  onMenuProfile?.();
                }}
                style={[
                  styles.menuRow,
                  profileMenuHighlightProfile ? styles.menuRowActive : undefined,
                ]}
              >
                <Ionicons name="person-outline" size={22} color="#cbd5e1" style={styles.menuIcon} />
                <RNText style={styles.menuLabel}>Profile</RNText>
              </RNPressable>

              <View style={styles.divider} />

              <RNPressable
                onPress={() => {
                  closeProfileMenu();
                  onMenuLogout?.();
                }}
                style={styles.menuRow}
              >
                <Ionicons name="log-out-outline" size={22} color="#cbd5e1" style={styles.menuIcon} />
                <RNText style={styles.menuLabel}>Logout</RNText>
              </RNPressable>
            </View>
          </View>
        </View>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  siteMenuWrap: {
    position: 'absolute',
  },
  siteMenu: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingTop: 10,
    paddingBottom: 8,
    maxHeight: SITE_MENU_MAX_H,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  siteMenuTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  siteScroll: {
    maxHeight: SITE_MENU_MAX_H - 48,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  siteRowLast: {
    borderBottomWidth: 0,
  },
  siteRowText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 16,
    marginRight: 8,
  },
  siteRowTextActive: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  menuWrap: {
    position: 'absolute',
  },
  menu: {
    backgroundColor: '#0d1526',
    borderRadius: MENU_RADIUS,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuRowActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderRadius: 12,
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#1e293b',
    marginVertical: 4,
    marginHorizontal: 12,
  },
});
