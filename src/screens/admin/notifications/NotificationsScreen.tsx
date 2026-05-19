import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Pressable, Spinner, Text, VStack } from '@gluestack-ui/themed';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef } from 'react';
import { FlatList, ListRenderItem, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader, { APP_HORIZONTAL_PADDING } from '../../../components/layout/AppHeader';
import { clearAlerts } from '../../../features/alerts/alertsSlice';
import { logout } from '../../../features/auth/authSlice';
import { clearCameras } from '../../../features/cameras/camerasSlice';
import {
  clearNotifications,
  fetchNotifications,
  markNotificationsRead,
  NOTIFICATIONS_PAGE_SIZE,
} from '../../../features/notifications/notificationsSlice';
import { toastError, toastSuccess } from '../../../utils/toast';
import type { NotificationDto } from '../../../features/notifications/notifications.types';
import { clearSites } from '../../../features/sites/sitesSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const BG = '#050a14';
const CARD = '#081a36';
const CARD_BORDER = 'rgba(56, 189, 248, 0.25)';
const MUTED = '#8aa0bd';
const VALUE = '#ffffff';
const MARK_READ = '#38bdf8';
const ICON_BG = 'rgba(127, 29, 29, 0.55)';
const ICON_COLOR = '#f87171';
const UNREAD_DOT = '#38bdf8';

function formatNotificationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const hours = d.getHours();
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const mins = String(d.getMinutes()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${h12}:${mins} ${ampm} ${yyyy}-${mm}-${dd}`;
}

function notificationIconName(type?: string | null): keyof typeof Ionicons.glyphMap {
  const t = (type ?? '').toUpperCase();
  if (t === 'CAMERA') return 'videocam-outline';
  return 'notifications-outline';
}

function locationLine(item: NotificationDto): string {
  const info = item.notificationInfo;
  const site = info?.siteName?.trim();
  const zone = info?.zoneName?.trim();
  if (site && zone) return `${site} → ${zone}`;
  return site ?? zone ?? '-';
}

function NotificationCard({ item }: Readonly<{ item: NotificationDto }>) {
  return (
    <Box
      bg={CARD}
      borderRadius={16}
      borderWidth={1}
      borderColor={CARD_BORDER}
      px="$4"
      py="$4"
      mb="$3"
    >
      <HStack alignItems="flex-start" space="md">
        <Box
          w={44}
          h={44}
          borderRadius={22}
          bg={ICON_BG}
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name={notificationIconName(item.type)} size={22} color={ICON_COLOR} />
        </Box>

        <VStack flex={1} space="xs" pr="$4">
          <Text color={VALUE} fontSize={15} fontWeight="$bold" lineHeight={20}>
            {item.message}
          </Text>

          <HStack alignItems="center" space="xs" flexWrap="wrap">
            <Ionicons name="location-outline" size={14} color={MUTED} />
            <Text color={MUTED} fontSize={13}>
              {locationLine(item)}
            </Text>
          </HStack>

          <Text color={MUTED} fontSize={12} mt="$1">
            {formatNotificationDate(item.createdDate)}
          </Text>
        </VStack>

        {!item.read ? (
          <Box
            position="absolute"
            top={12}
            right={12}
            w={10}
            h={10}
            borderRadius={5}
            bg={UNREAD_DOT}
          />
        ) : null}
      </HStack>
    </Box>
  );
}

function NotificationSkeleton() {
  return (
    <Box
      bg={CARD}
      borderRadius={16}
      borderWidth={1}
      borderColor={CARD_BORDER}
      px="$4"
      py="$4"
      mb="$3"
      opacity={0.7}
    >
      <HStack space="md" alignItems="center">
        <Box w={44} h={44} borderRadius={22} bg="rgba(30, 41, 59, 0.8)" />
        <VStack flex={1} space="sm">
          <Box w="90%" h={14} borderRadius={6} bg="rgba(148, 163, 184, 0.2)" />
          <Box w="70%" h={12} borderRadius={6} bg="rgba(71, 85, 105, 0.35)" />
          <Box w="50%" h={10} borderRadius={6} bg="rgba(100, 116, 139, 0.3)" />
        </VStack>
      </HStack>
    </Box>
  );
}

export default function NotificationsScreen({ navigation }: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { items, status, error, pageNumber, hasNext, isLoadingMore, markReadStatus } = useAppSelector(
    (s) => s.notifications,
  );
  const email = useAppSelector(
    (s) => s.auth.userEmail ?? s.auth.user?.email ?? s.auth.user?.username ?? '',
  );
  const loadingMoreRef = useRef(false);

  const loadInitial = useCallback(() => {
    void dispatch(fetchNotifications({ pageNo: 0, pageSize: NOTIFICATIONS_PAGE_SIZE, append: false }));
  }, [dispatch]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(() => {
    if (!hasNext || status === 'loading' || isLoadingMore || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    void dispatch(
      fetchNotifications({
        pageNo: pageNumber + 1,
        pageSize: NOTIFICATIONS_PAGE_SIZE,
        append: true,
      }),
    ).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [dispatch, hasNext, status, isLoadingMore, pageNumber]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleMarkAllRead = useCallback(() => {
    if (markReadStatus === 'loading') return;
    void dispatch(markNotificationsRead({ notificationId: null, readAll: true })).then((result) => {
      if (markNotificationsRead.fulfilled.match(result)) {
        toastSuccess('Marked as read', result.payload);
        return;
      }
      if (markNotificationsRead.rejected.match(result)) {
        toastError('Mark as read failed', result.payload ?? 'Please try again.');
      }
    });
  }, [dispatch, markReadStatus]);

  const renderItem: ListRenderItem<NotificationDto> = useCallback(
    ({ item }) => <NotificationCard item={item} />,
    [],
  );

  const loading = status === 'loading' && items.length === 0;

  return (
    <Box flex={1} bg={BG}>
      <AppHeader
        showNotifications={false}
        onMenuProfile={() => navigation.navigate('Profile', { email })}
        onMenuLogout={() => {
          dispatch(clearAlerts());
          dispatch(clearCameras());
          dispatch(clearNotifications());
          dispatch(clearSites());
          dispatch(logout());
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
        }}
      />

      <HStack
        px={APP_HORIZONTAL_PADDING}
        pt="$3"
        pb="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <Pressable
          onPress={handleBack}
          flexDirection="row"
          alignItems="center"
          px="$3"
          py="$2"
          borderRadius="$full"
          bg="rgba(15, 23, 42, 0.95)"
          borderWidth={1}
          borderColor="rgba(56, 189, 248, 0.35)"
        >
          <Ionicons name="arrow-back" size={16} color="#e2e8f0" />
          <Text color="#e2e8f0" fontSize={12} fontWeight="$bold" ml="$1">
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={handleMarkAllRead}
          flexDirection="row"
          alignItems="center"
          opacity={markReadStatus === 'loading' ? 0.5 : 1}
          disabled={markReadStatus === 'loading'}
        >
          {markReadStatus === 'loading' ? (
            <Spinner size="small" color={MARK_READ} />
          ) : (
            <Ionicons name="checkmark-done" size={20} color="#22c55e" />
          )}
          <Text color={MARK_READ} fontSize={14} fontWeight="$semibold" ml="$1">
            Mark as read
          </Text>
        </Pressable>
      </HStack>

      <Text color={VALUE} fontSize={26} fontWeight="$bold" px={APP_HORIZONTAL_PADDING} mb="$2">
        Notifications
      </Text>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        ListHeaderComponent={
          error ? (
            <Text color="#ef4444" fontSize={13} mb="$3">
              {error}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <VStack>
              {Array.from({ length: 5 }).map((_, i) => (
                <NotificationSkeleton key={`notif-skel-${i}`} />
              ))}
            </VStack>
          ) : (
            <Text color={MUTED} textAlign="center" py="$10" fontSize={14}>
              No notifications
            </Text>
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <HStack py="$4" justifyContent="center" space="sm">
              <Spinner size="small" color={MARK_READ} />
              <Text color={MUTED} fontSize={13}>
                Loading more…
              </Text>
            </HStack>
          ) : (
            <View style={{ height: insets.bottom + 16 }} />
          )
        }
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});
