<script>
  import { onMount } from "svelte";
  import { StackRouter, slide } from "svelte-stack-router";

  import Play from "./components/Play.svelte";
  import MiniPlay from "./components/MiniPlay.svelte";
  import Loading from "./components/Loading.svelte";
  import { TabBar } from "./components/base";

  import { formatURL } from "./utils/common";

  import { getSongUrl, personalFM, getSongDetail } from "./api/song";
  import { userPlaylist, userLikedSongsIDs, likedArtists } from "./api/user";

  import routes from "./routes";

  import {
    isLoadingStore,
    isHomePageStore,
    restoreScrollStore,
    defaultResumableStore,
    isLoginStore,
  } from "./store/common";
  import {
    currentSongStore,
    currentPlayListStore,
    currentSongIndexStore,
    playIsMaxStore,
    playIsMinStore,
    isPlaying,
    playerTop,
    isFMPlaying,
    FMPlayStore,
    FMPlayNextStore,
    currentTimeStore,
    playerShowType,
    playRepeatModelStore,
    currentSongQualityStore,
  } from "./store/play";

  import {
    timeToMinute,
    Toast,
    Alert,
    Confirm,
    getUserAgentInfo,
    getOsInfo,
  } from "./utils/common";

  let audioDOM;
  let audioDOMIsRander = false;
  let endTime = 0;
  let currentTime = "0:00";
  let currentTimeLong = 0;

  window.addEventListener("hashchange", function (event) {
    if (
      event.newURL.indexOf("#") < 0 ||
      event.newURL.split("#")[1] === "" ||
      event.newURL.split("#")[1] === "/"
    ) {
      isHomePageStore.set(true);
    } else {
      isHomePageStore.set(false);
    }
    if (
      event.oldURL.indexOf("#") > 0 &&
      event.oldURL.split("#")[1] === "/login"
    ) {
      location.reload();
    }
  });

  // history.pushState(null, null, location.href);
  window.addEventListener("popstate", function (event) {
    if ($playIsMaxStore) {
      playIsMaxStore.set(false);
      playerShowType.set("cover");
      playerTop.set(window.screen.height + "px");
    }
  });
  

  onMount(() => {
    // 开启页面重新请求播放列表数据
    // if (localStorage.getItem("localPlayList")) {
    //   let localPlayList = JSON.parse(localStorage.getItem("localPlayList"));
    //   if (localPlayList.length > 300) {
    //     localPlayList = localPlayList.slice(0, 300);
    //   }
    //   getLocalPlayListFun(localPlayList.join(","));
    // }
    if (
      location.href.indexOf("#") < 0 ||
      location.href.split("#")[1] === "" ||
      location.href.split("#")[1] === "/"
    ) {
      isHomePageStore.set(true);
    } else {
      isHomePageStore.set(false);
    }
    window.audioDOM = audioDOM;
    window.audioDOM.addEventListener("canplaythrough", function () {
      // 音频可以播放了
      audioDOMIsRander = true;
      endTime =
        "-" +
        timeToMinute(window.audioDOM.duration - window.audioDOM.currentTime);
    });

    window.audioDOM.addEventListener("timeupdate", function () {
      currentTimeStore.set(window.audioDOM.currentTime);
      // 更新与播放进度相关的内容
      currentTime = timeToMinute(window.audioDOM.currentTime);
      currentTimeLong =
        (window.audioDOM.currentTime / window.audioDOM.duration) * 100;
      endTime =
        "-" +
        timeToMinute(window.audioDOM.duration - window.audioDOM.currentTime);
    });
    window.audioDOM.addEventListener(
      "ended",
      function () {
        if ($isFMPlaying) {
          //私人FM播放
          playerShowType.set("cover");
          getSongUrlFun($FMPlayNextStore, "fm");
        } else {
          if (
            $playRepeatModelStore != "repeatOnce" &&
            $currentSongIndexStore === $currentPlayListStore.length - 1
          ) {
            Toast("已经是最后一首了", 2000);
          } else {
            if ($playRepeatModelStore === "shuffle") {
              //随机
              let index = Math.floor(
                Math.random() * ($currentPlayListStore.length - 1)
              );
              if ($playerShowType === "lyric") playerShowType.set("cover");
              getSongUrlFun($currentPlayListStore[index], "shuffle", index);
            } else if ($playRepeatModelStore === "repeatOnce") {
              //单曲循环
              if ($playerShowType === "lyric") playerShowType.set("cover");
              getSongUrlFun(
                $currentPlayListStore[$currentSongIndexStore],
                "once",
                $currentSongIndexStore
              );
            } else {
              if ($playerShowType === "lyric") playerShowType.set("cover");
              getSongUrlFun($currentPlayListStore[$currentSongIndexStore + 1]);
            }
          }
        }
      },
      false
    );
    //解决长时间不播放URL失效问题(暂定30分钟过期)
    if (
      (new Date().getTime() - Number(localStorage.getItem("pauseTimes"))) /
        1000 /
        60 >
      30
    ) {
      window.audioDOM.src = `https://music.163.com/song/media/outer/url?id=${$currentSongStore.id}.mp3`;
    } else {
      window.audioDOM.src = $currentSongStore.url;
    }
    // window.audioDOM.src = "https://m8.music.126.net/20210907010112/541ee038536db12045e4a99d565becd8/ymusic/5614/195d/ad51/33fff191fffc2fd5da6c94d71e7777ef.mp3";
    window.audioDOM.load(); //解决iOS canplaythrough不生效问题
  });
  //获取所有歌曲详情
  async function getLocalPlayListFun(songIds) {
    const res = await getSongDetail(songIds);
    if (res.code === 200) {
      let songs = res.songs;
      if (!songIds.split(",").includes($currentSongStore.id.toString())) {
        songs.unshift($currentSongStore);
        currentSongIndexStore.set(0);
      } else {
        currentSongIndexStore.set(
          songIds.split(",").indexOf($currentSongStore.id.toString())
        );
      }
      currentPlayListStore.set(songs);
      let ids = [];
      for (let r = 0; r < songs.length; r++) {
        ids.push(songs[r].id);
      }
      localStorage.setItem("localPlayList", JSON.stringify(ids));
    }
  }

  async function getSongUrlFun(song, type, index) {
    const res = await getSongUrl(song.id); //获取歌曲url
    if (res.code === 200) {
      if (res.data[0].url) {
        song.url = formatURL(res.data[0].url);
        if (res.data[0].fee === 1 && res.data[0].freeTrialInfo != null) {
          currentSongQualityStore.set("试听");
        } else if (res.data[0].type === "flac") {
          currentSongQualityStore.set("FLAC");
        } else {
          currentSongQualityStore.set(res.data[0].br);
        }
        window.audioDOM.src = song.url;
        window.audioDOM.play();
        isPlaying.set(true);
        if ($isFMPlaying) {
          //私人FM播放
          personalFMFun();
          FMPlayStore.set(song);
          currentSongStore.set(song);
          currentPlayListStore.set([$FMPlayStore]);
          currentSongIndexStore.set(0);
          localStorage.setItem("currentSong", JSON.stringify(song));
        } else {
          if (type === "shuffle") {
            currentSongStore.set(song);
            localStorage.setItem("currentSong", JSON.stringify(song));
            currentSongIndexStore.set(index);
          } else if (type === "once") {
            currentSongStore.set(song);
            localStorage.setItem("currentSong", JSON.stringify(song));
            currentSongIndexStore.set(index);
            if ($currentSongIndexStore !== $currentPlayListStore.length - 1) {
              getSongUrl($currentPlayListStore[$currentSongIndexStore + 1].id);
            }
          } else {
            currentSongStore.set(song);
            localStorage.setItem("currentSong", JSON.stringify(song));
            currentSongIndexStore.set($currentSongIndexStore + 1);
            if ($currentSongIndexStore !== $currentPlayListStore.length - 1) {
              getSongUrl($currentPlayListStore[$currentSongIndexStore + 1].id);
            }
          }
        }
      } else {
        Toast(
          `😂 无法播放「${song.name}」！可能是版权原因......吧！请播放下一首。`,
          2000
        );
      }
    }
  }
  //私人FM
  async function personalFMFun() {
    const res = await personalFM();
    if (res.code === 200) {
      res.data[0].al = res.data[0].album;
      res.data[0].ar = res.data[0].artists;
      res.data[0].alia = res.data[0].alias;
      FMPlayNextStore.set(res.data[0]);
    }
  }
</script>

<audio bind:this={audioDOM} src="" />

<StackRouter
  {routes}
  restoreScroll={$restoreScrollStore}
  transitionFn={slide(300)}
  on:navigation-start={(e) => {
    // 0--前进，2--后退,1--替换
    if (e.detail.navigationType === 0) {
      defaultResumableStore.set(false);
    } else if (e.detail.navigationType === 2) {
      defaultResumableStore.set(true);
    } else {
      defaultResumableStore.set(false);
    }
  }}
/>

{#if $playIsMinStore && audioDOMIsRander}
  <MiniPlay {currentTimeLong} />
{/if}
<Play {endTime} {currentTime} {currentTimeLong} />
<TabBar />
{#if $isLoadingStore}
  <Loading />
{/if}

<style>
</style>
