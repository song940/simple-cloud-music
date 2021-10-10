import { writable } from "svelte/store";

//用户信息
export const userInfoStore = writable(
  JSON.parse(localStorage.getItem("isLogin"))
    ? JSON.parse(localStorage.getItem("userInfo"))
    : {}
);


//用户喜欢的音乐IDs
export const userLikedArtistsStore = writable([]);
export const userLikedSongIdsStore = writable([]);
//我喜欢的音乐歌单ID
export const userLikedPlaylistStore = writable([]);