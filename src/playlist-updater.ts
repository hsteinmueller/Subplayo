import {settings} from './settings.js';
import {ChannelSkipReason, logger} from './logger.js';
import {type RetVal, type Video, youTubeClient} from './youtube-client.js';

export const playlistUpdater = (() => {
  function run() {
    const playlistIds = Object.keys(settings.playlists);
    const fetchedPlaylists = _fetchPlaylists(playlistIds);

    const channelIds = Object.values(settings.playlists).flat();
    const fetchedChannels = _fetchChannels(channelIds);

    for (const playlistId of playlistIds) {
      const playlistTitle = fetchedPlaylists.find(playlist => playlist.id === playlistId)?.value;

      if (!playlistTitle || !(typeof playlistTitle === 'string')) {
        logger.logPlaylistSkipping(playlistId);

        continue;
      }

      _processPlaylist(playlistId, playlistTitle, fetchedChannels);
    }
  }

  function _fetchPlaylists(playlistIds: string[]): RetVal[] {
    logger.logPlaylistsFetching();

    const {result: playlists, error} = _safeExecute(() => youTubeClient.getPlaylistsByIds(playlistIds));

    if (!playlists || error) {
      logger.logPlaylistsFetchFailure(error?.details.message);

      throw error;
    }

    return playlists;
  }

  function _fetchChannels(channelIds: string[]): RetVal[] {
    logger.logChannelsFetching();

    const {result: channels, error} = _safeExecute(() => youTubeClient.getChannelsByIds(channelIds));

    if (!channels || error) {
      logger.logChannelsFetchFailure(error?.details.message);

      throw error;
    }

    return channels;
  }

  function _processPlaylist(playlistId: string, playlistTitle: string, fetchedChannels: RetVal[]) {
    logger.logPlaylistProcessing(playlistTitle);

    const playlistIds = settings.playlists[playlistId] ?? [];
    for (const channelId of playlistIds) {
      const channel = fetchedChannels.find(channel => channel.id === channelId)?.value;

      if (channel === undefined || (typeof channel === 'string')) {
        logger.logChannelSkipping(channel ?? channelId, channel ? ChannelSkipReason.LIST_UNAVAILABLE : ChannelSkipReason.NOT_FOUND);
      } else if (!channel.uploadsPlaylistId) {
        logger.logChannelSkipping(channel.title ?? channelId, channel ? ChannelSkipReason.LIST_UNAVAILABLE : ChannelSkipReason.NOT_FOUND);
      } else {
        _checkChannel(playlistId, channelId, channel);
      }
    }
  }

  function _checkChannel(playlistId: string, channelId: string, channel: {
    title: string | undefined,
    uploadsPlaylistId: string,
  }) {
    const {
      result: latestVideos,
      error
    } = _safeExecute(() => youTubeClient.getLatestVideosByPlaylistId(channel.uploadsPlaylistId));

    if (error || !latestVideos || latestVideos.length === 0) {
      logger.logChannelSkipping(channel.title, ChannelSkipReason.NO_VIDEOS);

      return;
    }

    logger.logChannelChecking(channel.title);

    const scriptProperties = PropertiesService.getScriptProperties();
    const lastStoredValue = scriptProperties.getProperty(channelId) ?? '';

    let parsedTimestamp = Date.parse(lastStoredValue);

    if (isNaN(parsedTimestamp)) {
      logger.logNewChannelDiscovery();

      parsedTimestamp = latestVideos.length > 1 ? Date.parse(latestVideos[1]?.publishedAt ?? '') : 0; // todo: check this
    }

    const index = latestVideos.findIndex(video => Date.parse(video.publishedAt ?? '') <= parsedTimestamp);
    const newVideos = index === -1 ? latestVideos : latestVideos.slice(0, index);

    logger.logNewVideosFinding(newVideos.length);

    for (const video of newVideos.slice().reverse()) {
      _addVideo(playlistId, video);
    }

    if (newVideos.length > 0) {
      scriptProperties.setProperty(channelId, newVideos[0]?.publishedAt ?? '');
    }
  }

  function _addVideo(playlistId: string, video: Video) {
    const {error} = _safeExecute(() => youTubeClient.addVideoToPlaylist(video.id, playlistId));

    if (error) {
      logger.logVideoAdditionFailure(video.title, error.details.message);

      return;
    }

    logger.logVideoAddition(video.title);
  }

  interface Status {
    code: number;
    details: Record<string, string | undefined>;
    message: string;
  }

  function _safeExecute<T>(operation: () => T): { result: T | null, error: Status | null } {
    try {
      return {result: operation(), error: null};
    } catch (exception) {
      return {result: null, error: exception as Status};
    }
  }

  return {
    run
  };
})();
