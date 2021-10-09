<script>
  import { onMount } from "svelte";
  import Lazy from "svelte-lazy";
  import { onResume, search } from "svelte-stack-router";
  import {
    PlayCircleLine,
    ChatHeartFill,
    ChatHeartLine,
  } from "svelte-remixicon";

  import { Button, NavBar } from "../components/base";
  import SongList from "../components/SongList.svelte";

  import { playListIdStore } from "../store/playList";
  import {
    isLoginStore,
    isLoadingStore,
    defaultResumableStore,
    defaultCover,
  } from "../store/common";
  import {
    currentSongStore,
    playStatusStore,
    currentPlayListStore,
    currentSongIndexStore,
    isFMPlayStore,
    playRepeatModelStore,
    currentSongQualityStore,
  } from "../store/play";
  import { userInfoStore } from "../store/user";

  import { getPlaylistDetail, subscribePlaylist } from "../api/playlist";
  import { getSongUrl, getSongDetail } from "../api/song";

  import { formatTime, Toast, cutArray, parseQuery } from "../utils/common";

  let coverDom;
  $: playlistId = null;
  $: collect = false;
  $: title = "歌单详情";
  $: description = "";
  $: alphaNumber = 0; //NavBar透明度的值
  $: songList = [];
  $: coverImgUrl = defaultCover;
  $: name = "歌单名称";
  $: updateTime = new Date().getTime();
  $: creator = {
    nickname: "创建者",
    avatarUrl: defaultCover,
    id: 0,
  };

  const { id } = parseQuery($search);
  playlistId = id;

  onMount(() => {
    getPlaylistDetailFun();
  });

  onResume(() => {
    if (!$defaultResumableStore) {
      songList = [];
      getPlaylistDetailFun();
    }
  });

  async function getPlaylistDetailFun() {
    console.debug("getPlaylistDetail", playlistId);
    const res = await getPlaylistDetail(playlistId); //获取歌单详情
    if (res.code === 200) {
      isLoadingStore.set(true);

      const { trackIds } = res.playlist;

      name = title = res.playlist.name;
      creator = res.playlist.creator;
      description = res.playlist.description;
      coverImgUrl = res.playlist.coverImgUrl;
      updateTime = res.playlist.updateTime;

      const songIdList = trackIds.map((trackIdInfo) => trackIdInfo.id);
      let cutSongIdList = cutArray(songIdList);
      for (let t = 0; t < cutSongIdList.length; t++) {
        await getSongDetailFun(cutSongIdList[t]);
      }
    }
  }
  async function getSongDetailFun(songIds) {
    if (Array.isArray(songIds)) songIds = songIds.join(",");
    const res = await getSongDetail(songIds); //所有获取歌曲详情
    if (res.code === 200) {
      songList = songList.concat(res.songs);
    }
  }
  function scroll() {
    const coverToTop = coverDom.getBoundingClientRect().top; //滑动时coverDom到顶部的距离，用于计算上滑时NavBar透明度。
    if (coverToTop > -50 && coverToTop <= 0) {
      alphaNumber = Math.abs(coverToTop) / 50;
    } else {
      alphaNumber = 1;
    }
    if (coverToTop > 0) {
      alphaNumber = 0;
    }
  }

  const playURL = (url) => {
    window.audioDOM.src = url;
    window.audioDOM.play();
  };

  const playSong = (song) => {
    currentSongStore.set(song);
    localStorage.setItem("currentSong", JSON.stringify(song));
    playURL(song.url);
  };

  async function getSongUrlFun(song) {
    const res = await getSongUrl(song.id); //获取歌单url
    if (res.code !== 200) return;
    if (res.data[0].url) {
      song.url = res.data[0].url.replace(/^http:/, "https:");
      if (res.data[0].fee === 1 && res.data[0].freeTrialInfo != null) {
        currentSongQualityStore.set("试听");
      } else if (res.data[0].type === "flac") {
        currentSongQualityStore.set("FLAC");
      } else {
        currentSongQualityStore.set(res.data[0].br);
      }
      playSong(song);
      playStatusStore.set(true);
      // if ($currentSongIndexStore !== $currentPlayListStore.length - 1)
      //   getSongUrl($currentPlayListStore[$currentSongIndexStore + 1].id);
    } else {
      Toast(
        `😂 无法播放「${song.name}」！可能是版权原因......吧！请播放下一首。`,
        2000
      );
    }
  }
  function playListFun(index) {
    playRepeatModelStore.set("repeat");
    isFMPlayStore.set(false);
    localStorage.setItem("isFMPlay", "0");
    currentPlayListStore.set(songList);
    const ids = songList.map((song) => song.id);
    localStorage.setItem("localPlayList", JSON.stringify(ids));

    currentSongIndexStore.set(index);
    getSongUrlFun($currentPlayListStore[$currentSongIndexStore]);
  }
  async function subscribe() {
    const res = await subscribePlaylist(playlistId, !collect);
    if (res.code === 200) {
      collect = !collect;
    }
  }
</script>

<svelte:window on:scroll={scroll} />
<NavBar {title} transparent={true} dark={true} {alphaNumber} />
<div class="play-list">
  <div
    class="cover-box"
    bind:this={coverDom}
    style="background: url({coverImgUrl.replace(/^http:/, 'https:') +
      '?param=450y450'});"
  >
    <div class="cover-bg">
      <div class="cover">
        <Lazy height={140}>
          <img
            class="img-cover"
            src={coverImgUrl.replace(/^http:/, "https:") + "?param=450y450"}
            alt=""
          />
        </Lazy>
      </div>
      <div class="info">
        <div class="name">{name}</div>
        <div class="creater">
          <img
            class="creatorImg"
            src={creator.avatarUrl.replace(/^http:/, "https:") + "?param=60y60"}
            alt=""
          />
          <span class="creatertext">{creator.nickname}</span>
        </div>
        <div class="update">
          更新于{formatTime(updateTime)} &#8226 {songList
            ? songList.length
            : 0}首
        </div>
      </div>
    </div>
  </div>
  <div class="desc">{description}</div>
  <div class="btn">
    <div
      class="play"
      style="margin-right: {$isLoginStore &&
      creator.userId != $userInfoStore.account.id
        ? 20
        : 0}px;"
    >
      <Button type="primary" on:BtnClick={() => playListFun(0)}>
        <span class="icon">
          <PlayCircleLine size="20" style="vertical-align: middle" />
        </span>
        播放歌单
      </Button>
    </div>
    {#if $isLoginStore && creator.userId != $userInfoStore.account.id}
      <div class="random">
        <Button type={collect ? "default" : "primary"} on:BtnClick={subscribe}>
          <span class="icon">
            {#if collect}
              <ChatHeartLine size="20" style="vertical-align: middle" />
            {:else}
              <ChatHeartFill size="20" style="vertical-align: middle" />
            {/if}
          </span>
          {collect ? "取消收藏" : "收藏歌单"}
        </Button>
      </div>
    {/if}
  </div>
  <div>
    <SongList {songList} />
  </div>
</div>

<style>
  .icon {
    position: relative;
    top: -2px;
  }
  .btn {
    display: flex;
    margin-bottom: 10px;
    padding: 0 20px;
    flex-basis: 20px;
  }
  .play {
    margin-right: 20px;
    flex: 1;
  }
  .random {
    flex: 1;
  }
  .cover-box {
    background-position: center !important;
  }
  .cover-bg {
    font-size: 12px;
    padding: 60px 20px 20px;
    display: flex;
    color: #fff;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .img-cover {
    border-radius: 6px;
    width: 140px;
    height: 140px;
    object-fit: cover;
  }
  .cover {
    flex: 2;
  }
  .info {
    padding-top: 6px;
    flex: 3;
    align-items: center;
    margin-left: 10px;
    position: relative;
  }
  .name {
    font-size: 18px;
    max-width: 192px;
    font-weight: bold;
  }
  .creater {
    margin-top: 8px;
    align-items: center;
    line-height: 24px;
  }
  .creatorImg {
    border-radius: 4px;
    width: 24px;
    height: 24px;
    margin-right: 4px;
  }
  .creatertext {
    position: relative;
    top: -8px;
  }
  .update {
    position: absolute;
    bottom: 6px;
  }
  .desc {
    margin: 10px 20px;
    font-size: 12px;
    max-height: 60px;
    overflow-y: auto;
    text-align: justify;
    color: rgb(116, 116, 116);
  }
  .desc:global(::-webkit-scrollbar) {
    width: 0 !important;
  }
  .play-list {
    padding-bottom: 70px;
  }
</style>
