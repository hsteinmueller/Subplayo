import {youTubeClient} from './youtube-client.js';
import {playlistUpdater} from './playlist-updater.js';
import {logger} from './logger.js';

const addNewVideosToPlaylists = () => {
  playlistUpdater.run();
};

const listMyPlaylists = () => {
  const playlists = youTubeClient.listUserPlaylists();

  for (const playlist of playlists) {
    logger.logPlaylistListItem(playlist.id, playlist.title);
  }
};

const listMySubscriptions = () => {
  const subscriptions = youTubeClient.listUserSubscriptions();

  for (const subscription of subscriptions) {
    logger.logChannelListItem(subscription.channelId, subscription.channelTitle);
  }
};

// @ts-ignore
globalThis.addNewVideosToPlaylists = addNewVideosToPlaylists;
// @ts-ignore
globalThis.listMyPlaylists = listMyPlaylists;
// @ts-ignore
globalThis.listMySubscriptions =listMySubscriptions;
