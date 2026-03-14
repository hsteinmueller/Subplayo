type YoutubeListResponse =
  GoogleAppsScript.YouTube.Schema.PlaylistListResponse
  | GoogleAppsScript.YouTube.Schema.SubscriptionListResponse;

const youTubeClient = (() => {

  const MAX_BATCH = 50;

  function addVideoToPlaylist(videoId: string, playlistId: string) {
    const requestBody = {
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
    return _fetchBatchedData(channelIds, YouTube?.Channels.list, 'contentDetails,snippet', item => ({
        id: item.id,
        value: {
          title: item.snippet?.title,
          // @ts-ignore
          uploadsPlaylistId: item.contentDetails?.relatedPlaylists.uploads
        }
      })
    );
  }

  function getLatestVideosByPlaylistId(playlistId: string) {
    const response = YouTube?.PlaylistItems.list('contentDetails,snippet', {
      playlistId: playlistId,
      maxResults: MAX_BATCH
    });

    return response?.items?.map(item => ({
      id: item.snippet?.resourceId?.videoId,
      title: item.snippet?.title,
      publishedAt: item.contentDetails?.videoPublishedAt
    }));
  }

  function getPlaylistsByIds(playlistIds: string[]) {
    return _fetchBatchedData(playlistIds, YouTube?.Playlists.list, 'snippet', item => ({
        id: item.id,
        value: item.snippet?.title
      })
    );
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

  type  RetVal = { title: string | undefined, uploadsPlaylistId: string } | string | undefined;

  function _fetchBatchedData(ids: string[], apiOperation: {
    (part: string): GoogleAppsScript.YouTube.Schema.ChannelListResponse;
    (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.ChannelListResponse
  } | undefined | {
    (part: string): GoogleAppsScript.YouTube.Schema.PlaylistListResponse;
    (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.PlaylistListResponse
  }, apiPart: any, transformOperation: (item: GoogleAppsScript.YouTube.Schema.Channel | GoogleAppsScript.YouTube.Schema.Playlist) => {
    id: string | undefined;
    value: { title: string | undefined, uploadsPlaylistId: string } | string | undefined;
  }) {
    const result: Record<string, RetVal> = {};

    if (apiOperation) {
      for (let i = 0; i < ids.length; i += MAX_BATCH) {
        const response = apiOperation(apiPart, {
          id: ids.slice(i, i + MAX_BATCH).join(','),
          maxResults: MAX_BATCH
        });

        response.items?.forEach(item => {
          const {id, value} = transformOperation(item);
          if (typeof id === 'string') {
            result[id] = value;
          }
        });
      }
    }

    return result;
  }

  function _fetchPaginatedData(apiOperation: {
    (part: string): GoogleAppsScript.YouTube.Schema.PlaylistListResponse;
    (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.PlaylistListResponse
  } | undefined | {
    (part: string): GoogleAppsScript.YouTube.Schema.SubscriptionListResponse;
    (part: string, optionalArgs: object): GoogleAppsScript.YouTube.Schema.SubscriptionListResponse
  }, apiPart: any, apiParameters: {
    mine: boolean
  }): GoogleAppsScript.YouTube.Schema.Playlist[] | GoogleAppsScript.YouTube.Schema.Subscription[] {
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

  return {
    addVideoToPlaylist,
    getChannelsByIds,
    getLatestVideosByPlaylistId,
    getPlaylistsByIds,
    listUserPlaylists,
    listUserSubscriptions
  };
})();
