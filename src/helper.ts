import {type Video, youTubeClient} from './youtube-client.js';

const THRESHOLD_SECONDS = 60;

export const filterShorts = (items: Video[] | undefined): Video[] => {

  const ids = items?.flatMap(item => item.id ?? []) ?? [];
  const videoDetails = youTubeClient.getContentDetails(ids);
  const filtered = items?.filter((item: GoogleAppsScript.YouTube.Schema.PlaylistItem) => {
    const detail = videoDetails.find((detail: GoogleAppsScript.YouTube.Schema.Video) => detail.id == item.id);
    const duration = detail?.contentDetails?.duration ?? '';
    return isShort(duration);
  })

  return filtered ?? [];
}

const isShort = (duration: string): boolean => {
  const match = duration.match(/PT(\d+M)?(\d+S)?/);
  if (match) {
    const minutes = match[1] ? parseInt(match[1]) : 0;
    const seconds = match[2] ? parseInt(match[2]) : 0;
    return minutes === 0 && seconds <= THRESHOLD_SECONDS;
  }
  return false;

};
