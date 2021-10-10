import {
  userLikedArtistsStore,
  userLikedSongIdsStore,
  userLikedPlaylistStore,
} from "../store/user";

import {
  likedArtists,
  userPlaylist,
  userLikedSongsIDs,
} from '../api/user';

export const userLikedSongsIDsAsync = async (login) => {
  let userLikedSongIds;
  const str = localStorage.getItem('userLikedSongIds');
  if (str) {
    userLikedSongIds = JSON.parse(str);
    userLikedSongsIDsFun(login);
  } else {
    userLikedSongIds = await userLikedSongsIDsFun(login);
  }
  userLikedSongIdsStore.set(userLikedSongIds);
  return userLikedSongIds;
};

/**
 * 获取用户喜爱歌曲ID列表,用于判断是否已经收藏
 * @param login
 */
async function userLikedSongsIDsFun(login) {
  const res = await userLikedSongsIDs(login.account.id);
  if (res.code === 200) {
    const ids = res.ids;
    localStorage.setItem('userLikedSongIds', JSON.stringify(ids));
    return ids;
  } else {
    Alert("获取喜爱歌曲失败");
  }
}

export const userPlaylistAsync = async (login) => {
  let userLikedPlaylistIds;
  const str = localStorage.getItem('userLikedPlaylistIds');
  if (str) {
    userLikedPlaylistIds = JSON.parse(str);
    userPlaylistFun(login);
  } else {
    userLikedPlaylistIds = await userPlaylistFun(login);
  }
  userLikedPlaylistStore.set(userLikedPlaylistIds);
  return userLikedPlaylistIds;
};

/**
 * 获取用户收藏歌单ID列表,用于判断是否已经收藏
 * @param login
 */
async function userPlaylistFun(login) {
  const res = await userPlaylist({
    uid: login.account.id,
    limit: 10000,
    offset: 0,
  });
  if (res.code === 200) {
    let ids = [];
    for (let i = 0; i < res.playlist.length; i++) {
      ids.push(res.playlist[i].id);
    }
    localStorage.setItem('userLikedPlaylistIds', JSON.stringify(ids));
    return ids;
  } else {
    Alert("获取收藏歌单失败");
  }
}

export const userLikedArtistsAsync = async (login) => {
  let userLikedArtistIds;
  const str = localStorage.getItem('userLikedArtistIds');
  if (str) {
    userLikedArtistIds = JSON.parse(str);
    userLikedArtistsFun(login);
  } else {
    userLikedArtistIds = await userLikedArtistsFun(login);
  }
  userLikedArtistsStore.set(userLikedArtistIds);
  return userLikedArtistIds;
};

/**
 * 获取收藏的歌手
 */
export async function userLikedArtistsFun() {
  const res = await likedArtists({ limit: 2000 });
  if (res.code === 200) {
    const ids = res.data.map(ar => ar.id);
    localStorage.setItem('userLikedArtistIds', JSON.stringify(ids));
    return ids;
  } else {
    Alert("获取喜爱歌手失败");
  }
}

export const sync = async (login) => {
  await userPlaylistAsync(login);
  await userLikedArtistsAsync();
  await userLikedSongsIDsAsync(login);
};