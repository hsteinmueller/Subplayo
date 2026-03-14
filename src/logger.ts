export enum ChannelSkipReason {
  NOT_FOUND = 'Channel not found on server',
  LIST_UNAVAILABLE = 'Could not retrieve video list',
  NO_VIDEOS = 'Channel has no videos'
};

export const logger = (() => {
  const PLAYLIST_ID_DISPLAY_WIDTH = 34;

  function logPlaylistsFetching() {
    console.info('→ Fetching playlists from YouTube');
  }

  function logPlaylistsFetchFailure(reason: string | undefined) {
    console.error('  → Failed to fetch playlists');
    console.error(`    → Reason: ${reason}`);
  }

  function logChannelsFetching() {
    console.info('→ Fetching channels from YouTube');
  }

  function logChannelsFetchFailure(reason: string | undefined) {
    console.error('  → Failed to fetch channels');
    console.error(`    → Reason: ${reason}`);
  }

  function logPlaylistProcessing(playlistTitle: string) {
    console.info(`→ Processing playlist: ${playlistTitle}`);
  }

  function logPlaylistSkipping(playlistId: string) {
    console.warn(`→ Skipping playlist: ${playlistId}`);
    console.warn(`  → Reason: Playlist not found on server`);
  }

  function logChannelChecking(channelTitle: string | undefined) {
    console.info(`  → Checking channel: ${channelTitle}`);
  }

  function logChannelSkipping(channelIdentifier: string |undefined, reason: ChannelSkipReason) {
    console.warn(`  → Skipping channel: ${channelIdentifier}`);
    console.warn(`    → Reason: ${reason}`);
  }

  function logNewChannelDiscovery() {
    console.info('    → New channel detected – only the most recent video will be added');
  }

  function logNewVideosFinding(newVideoCount: number) {
    console.info(newVideoCount > 0
      ? `    → Found ${newVideoCount} new video(s)`
      : `    → No new videos found`
    );
  }

  function logVideoAddition(videoTitle: string | undefined) {
    console.info(`      → Successfully added video: ${videoTitle}`);
  }

  function logVideoAdditionFailure(videoTitle: string | undefined, reason: string | undefined) {
    console.warn(`      → Failed to add video: ${videoTitle}`);
    console.warn(`        → Reason: ${reason}`);
  }

  function logChannelListItem(channelId: string | undefined, channelTitle: string | undefined) {
    console.info(`ID: ${channelId} | Title: ${channelTitle}`);
  }

  function logPlaylistListItem(playlistId: string | undefined, playlistTitle: string | undefined) {
    console.info(`ID: ${playlistId?.padEnd(PLAYLIST_ID_DISPLAY_WIDTH)} | Title: ${playlistTitle}`);
  }

  return {
    logPlaylistsFetching,
    logPlaylistsFetchFailure,
    logChannelsFetching,
    logChannelsFetchFailure,
    logPlaylistProcessing,
    logPlaylistSkipping,
    logChannelChecking,
    logChannelSkipping,
    logNewChannelDiscovery,
    logNewVideosFinding,
    logVideoAddition,
    logVideoAdditionFailure,
    logChannelListItem,
    logPlaylistListItem
  };
})();
