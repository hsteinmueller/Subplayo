import {filterShorts} from './helper.js';

type YoutubeListResponse =
  GoogleAppsScript.YouTube.Schema.PlaylistListResponse
  | GoogleAppsScript.YouTube.Schema.SubscriptionListResponse;

export type RetVal = {
  id: string | undefined;
  value: { title: string | undefined; uploadsPlaylistId: string } | string | undefined;
};

export interface Video {
  id: string | undefined;
  title: string | undefined;
  publishedAt: string | undefined;
}

export const youTubeClient = (() => {

  const MAX_BATCH = 50;

  function addVideoToPlaylist(videoId: string | undefined, playlistId: string) {
    const requestBody: GoogleAppsScript.YouTube.Schema.PlaylistItem = {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId: videoId
        }
      }
    };

    YouTube?.PlaylistItems.insert(requestBody, 'snippet');
  }

  function getChannelsByIds(channelIds: string[]) {
    if (YouTube) {
      return _fetchBatchedData<GoogleAppsScript.YouTube.Schema.Channel,
        GoogleAppsScript.YouTube.Schema.ChannelListResponse>(channelIds, YouTube.Channels.list, 'contentDetails,snippet', item => ({
          id: item.id,
          value: {
            title: item.snippet?.title,
            // @ts-ignore
            uploadsPlaylistId: item.contentDetails?.relatedPlaylists.uploads
          }
        })
      );
    }
    console.error('Youtube not initialized');
  }

  function getLatestVideosByPlaylistId(playlistId: string, includeShorts = false): Video[] | undefined {
    const response = YouTube?.PlaylistItems.list('contentDetails,snippet', {
      playlistId: playlistId,
      maxResults: MAX_BATCH
    });

    const items = response?.items?.map(item => ({
      id: item.snippet?.resourceId?.videoId,
      title: item.snippet?.title,
      publishedAt: item.contentDetails?.videoPublishedAt
    }));

    if (!includeShorts) {
      return filterShorts(items);
    }
    return items;
  }

  function getPlaylistsByIds(playlistIds: string[]) {
    if (YouTube) {
      return _fetchBatchedData<GoogleAppsScript.YouTube.Schema.Playlist,
        GoogleAppsScript.YouTube.Schema.PlaylistListResponse>(playlistIds, YouTube.Playlists.list, 'snippet', item => ({
          id: item.id,
          value: item.snippet?.title
        })
      );
    }

    console.error('Youtube not initialized');
  }

  function listUserPlaylists() {
    const items = _fetchPaginatedData(YouTube?.Playlists.list, 'snippet', {mine: true});

    return items.map(item => ({
      id: item.id,
      title: item.snippet?.title
    }));
  }

  function listUserSubscriptions() {
    const items = _fetchPaginatedData(YouTube?.Subscriptions.list, 'snippet', {mine: true});

    return items.map(item => ({
      // @ts-ignore
      channelId: item.snippet?.resourceId.channelId,
      channelTitle: item.snippet?.title
    }));
  }

  function _fetchBatchedData<TItem, TResponse extends { items?: TItem[] | undefined }>(
    ids: string[],
    apiOperation: {
      (part: string): TResponse;
      (part: string, optionalArgs: object): TResponse;
    },
    apiPart: string,
    transformOperation: (item: TItem) => RetVal
  ): RetVal[] {
    const result: RetVal[] = [];

    if (apiOperation) {
      for (let i = 0; i < ids.length; i += MAX_BATCH) {
        const response = apiOperation(apiPart, {
          id: ids.slice(i, i + MAX_BATCH).join(','),
          maxResults: MAX_BATCH
        });

        const transformed = response.items?.map((item: TItem) => {
          return transformOperation(item);
        }) ?? [];

        result.concat(transformed);
      }
    }

    return result;
  }

  function _fetchPaginatedData(
    apiOperation: {
      (part: string): GoogleAppsScript.YouTube.Schema.PlaylistListResponse;
      (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.PlaylistListResponse
    } | {
      (part: string): GoogleAppsScript.YouTube.Schema.SubscriptionListResponse;
      (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.SubscriptionListResponse
    } | undefined,
    apiPart: string,
    apiParameters: {
      mine: boolean
    }
  ): GoogleAppsScript.YouTube.Schema.Playlist[] | GoogleAppsScript.YouTube.Schema.Subscription[] {
    let result: GoogleAppsScript.YouTube.Schema.Playlist[] | GoogleAppsScript.YouTube.Schema.Subscription[] = [];
    let nextPageToken = null;

    if (apiOperation) {
      do {
        const response: YoutubeListResponse = apiOperation(apiPart, {
          ...apiParameters,
          maxResults: MAX_BATCH,
          pageToken: nextPageToken
        });

        // @ts-ignore: type this later
        result = result.concat(response.items);
        nextPageToken = response.nextPageToken;
      } while (nextPageToken);
    }

    return result;
  }

  function getContentDetails(videoIds: string[]): GoogleAppsScript.YouTube.Schema.Video[] {
    const ids = videoIds.join(',');
    const details = YouTube?.Videos.list('contentDetails', {
      id: ids,
      maxResults: MAX_BATCH,
    });

    return details?.items ?? [];
  }

  return {
    addVideoToPlaylist,
    getChannelsByIds,
    getLatestVideosByPlaylistId,
    getPlaylistsByIds,
    listUserPlaylists,
    listUserSubscriptions,
    getContentDetails
  };
})();
