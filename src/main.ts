import {youTubeClient} from './youtube-client.js';
import {playlistUpdater} from './playlist-updater.js';
import {logger} from './logger.js';

function addNewVideosToPlaylists() {
  playlistUpdater.run();
}

function listMyPlaylists() {
  const playlists = youTubeClient.listUserPlaylists();

  for (const playlist of playlists) {
    logger.logPlaylistListItem(playlist.id, playlist.title);
  }
}

function listMySubscriptions() {
  const subscriptions = youTubeClient.listUserSubscriptions();

  for (const subscription of subscriptions) {
    logger.logChannelListItem(subscription.channelId, subscription.channelTitle);
  }
}
