<script>
  import { onMount } from "svelte";
  import { push } from "svelte-stack-router";
  import {
    RadioFill,
    RefreshLine,
    Calendar2Fill,
  } from "svelte-remixicon";

  import TopTitle from "../components/TopTitle.svelte";
  import { Button } from "../components/base";
  import ListGrid from "../components/ListGrid.svelte";
  import SongList from "../components/SongList.svelte";
  import Songer from "../components/Singer.svelte";

  import { isLoginStore, defaultCover } from "../store/common";
  import {
    playIsMaxStore,
    isPlaying,
    currentSongStore,
    currentPlayListStore,
    currentSongIndexStore,
    playerTop,
    FMPlayStore,
    isFMPlaying,
    FMPlayNextStore,
    currentSongQualityStore,
  } from "../store/play";
  import { isHomePageStore } from "../store/common";
  import { dailyRecommendTracksStore } from "../store/playList";
  import {
    userInfoStore,
    userLikedArtistsStore,
    userLikedSongIdsStore,
    userLikedPlaylistStore,
  } from "../store/user";

  import {
    dailyRecommendTracks,
    getSimiPlaylist,
    dailyRecommendPlaylist,
    getPlaylistDetail,
  } from "../api/playlist";
  import {
    getSongUrl,
    personalFM,
    getSongDetail,
    getSimiSong,
  } from "../api/song";
  import { similarArtists, getSongerDetail } from "../api/songer";
  import {
    songerListToStr,
    Toast,
    ripple,
    fullWidth,
    formatURL,
    imageURL,
  } from "../utils/common";

  import { sync } from '../helper/user';

  let dailyRecommendPlayList = []; //每日歌单推荐
  let randomLoveSong = {}; //随机一个喜欢歌曲
  let similarPlayList = []; //相似歌单推荐
  let randomTenLoveSong = {}; //随机一个喜欢歌曲
  let similarSongs = []; //相似歌曲推荐
  let topTitleRightList = {
    type: "icon",
    path: RefreshLine,
  };
  let FMDom;
  let todayDom;
  $: isRefresh = false;
  $: simiSonger = {};
  $: simiSongers = [];

  const fetchData = async () => {
    if (!$isLoginStore) return;
    await sync($userInfoStore);
    dailyRecommendTracksFun();
    dailyRecommendPlaylistFun();
    personalFMFun(true);

    console.log("userLikedSongIdsStore:", $userLikedSongIdsStore);
    console.log("userLikedArtistsStore:", $userLikedArtistsStore);
    console.log("userLikedPlaylistStore:", $userLikedPlaylistStore);

    //收藏随机歌手一位
    const randomSongIndex = Math.floor(
      Math.random() * $userLikedSongIdsStore.length
    );
    const randomSong = $userLikedSongIdsStore[randomSongIndex];
    if (randomSong) {
      getSongDetailFun(randomSong);
      getSimiPlaylistFun(randomSong);
    }

    const randomArtistIndex = Math.floor(
      Math.random() * $userLikedArtistsStore.length
    );
    const randomArtist = $userLikedArtistsStore[randomArtistIndex];
    if (randomArtist) {
      getSongerDetailFun(randomArtist);
      similarArtistsFun(randomArtist);
    }
  };

  onMount(() => {
    if (FMDom) {
      ripple(FMDom);
    }
    if (todayDom) {
      ripple(todayDom);
    }
    fetchData();
  });

  /**
   * 播放私人FM
   */
  function playFMRadio() {
    if ($FMPlayStore.id === $currentSongStore.id) {
      window.audioDOM.play();
      isPlaying.set(true);
      playerTop.set("0px");
      playIsMaxStore.set(true);
    } else {
      isFMPlaying.set(true);
      localStorage.setItem("isFMPlay", "1");
      getSongUrlFun($FMPlayStore);
    }
  }
  /**
   * 请求私人FM
   * @param first
   */
  async function personalFMFun(first) {
    //first 是否是第一次请求私人FM
    const res = await personalFM();
    if (res.code === 200) {
      const [song1, song2] = res.data;

      song1.al = song1.album;
      song1.ar = song1.artists;
      song1.alia = song1.alias;

      song2.al = song2.album;
      song2.ar = song2.artists;
      song2.alia = song2.alias;
      if (first) {
        FMPlayStore.set(song1);
        FMPlayNextStore.set(song2);
        // localStorage.setItem("FMPlay", JSON.stringify($FMPlayStore));
      } else {
        FMPlayStore.set(song1);
      }
    }
  }
  //每日推荐歌曲
  async function dailyRecommendTracksFun() {
    const res = await dailyRecommendTracks();
    if (res.code === 200) {
      dailyRecommendTracksStore.set(res.data.dailySongs);
    }
  }
  //每日推荐歌单
  async function dailyRecommendPlaylistFun() {
    const res = await dailyRecommendPlaylist();
    if (res.code !== 200) return;
    const { recommend } = res;
    const [playlist] = recommend;
    const { name } = playlist;
    const playlistDetail = await getPlaylistDetail(playlist.id);
    Object.assign(playlist, playlistDetail.playlist);
    playlist.name = name;

    for (let i = 0; i < recommend.length; i++) {
      const list = recommend[i];
      const { name, copywriter, tracks } = list;
      const isRadar =
        copywriter === "猜你喜欢" && name.indexOf("私人雷达") !== -1;
      if (isRadar && tracks) {
        list.copywriter = name;
        list.name = `从《${tracks[0].name}》开始听吧`;
      }
      list.playCount = list.playcount;
      list.coverImgUrl =
        list.picUrl || list.coverImgUrl || list.tracks[0].al.picUrl;
    }
    dailyRecommendPlayList = recommend;
    console.debug("dailyRecommendPlayList", dailyRecommendPlayList);
    // 喜欢歌曲最新20首随机一首
    const randomIndexTen = Math.round(Math.random() * 20);
    randomTenLoveSong = playlistDetail.playlist.tracks[randomIndexTen];
    if (randomTenLoveSong) getSimiSongFun(randomTenLoveSong.id);
  }
  //请求歌曲详情
  async function getSongDetailFun(id) {
    if (!id) return;
    const res = await getSongDetail(id); //获取歌单详情
    if (res.code === 200) {
      randomLoveSong = res.songs[0];
    }
  }
  //请求相似歌单
  async function getSimiPlaylistFun(id) {
    if (!id) return;
    const res = await getSimiPlaylist(id); //获取歌单详情
    if (res.code === 200) {
      similarPlayList = res.playlists;
    }
  }
  //请求相似歌曲
  async function getSimiSongFun(id) {
    const res = await getSimiSong(id); //获取歌单详情
    if (res.code === 200) {
      if (isRefresh) isRefresh = false;
      for (let t = 0; t < res.songs.length; t++) {
        res.songs[t].al = res.songs[t].album;
        res.songs[t].ar = res.songs[t].artists;
      }
      similarSongs = res.songs;
    }
  }
  //获取歌曲URL
  async function getSongUrlFun(song) {
    const res = await getSongUrl(song.id);
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
          currentPlayListStore.set([song]);
          currentSongIndexStore.set(0);
          currentSongStore.set(song);
          song.al = song.album;
          song.ar = song.artists;
          song.alia = song.alias;
          FMPlayStore.set(song);
          localStorage.setItem("currentSong", JSON.stringify(song));
        }
      } else {
        Toast(
          `😂 无法播放「${song.name}」！可能是版权原因......吧！请播放下一首。`,
          2000
        );
      }
    }
  }
  //获取相似歌手
  async function similarArtistsFun(id) {
    const res = await similarArtists(id);
    if (res.code === 200) {
      let newSongerIds = [];
      for (let e = 0; e < res.artists.length; e++) {
        newSongerIds.push(res.artists[e].id);
      }
      let artists = distinct(newSongerIds, $userLikedArtistsStore); //交集
      for (let t = 0; t < artists.length; t++) {
        for (let p = 0; p < res.artists.length; p++) {
          if (artists[t] === res.artists[p].id) {
            res.artists.splice(p, 1);
          }
        }
      }
      simiSongers =
        res.artists.length > 6 ? res.artists.slice(0, 6) : res.artists;
    }
  }
  //获取随机歌手信息
  async function getSongerDetailFun(id) {
    const res = await getSongerDetail(id);
    if (res.code === 200) {
      simiSonger = res.data.artist;
    }
  }
  //数组去重
  function distinct(A, B) {
    let aSet = new Set(A);
    let bSet = new Set(B);
    //差集
    // let differenceSet = new Set([...aSet].filter(x => !bSet.has(x)));
    // return Array.from(differenceSet);
    // 交集;
    let intersection = new Set([...aSet].filter((x) => bSet.has(x)));
    return Array.from(intersection);
  }


  function clickRefresh(event) {
    if (event.detail.index === 0) {
      fetchData();
    }
  }

  /**
   * 今日推荐歌曲
  */
  function gotoDailyRecommendTracks() {
    isHomePageStore.set(false);
    push("/daily");
  }
</script>

<div class="love">
  {#if $isLoginStore}
    <div class="login-box">
      <TopTitle
        title="推荐"
        desc="专属推荐"
        {topTitleRightList}
        {isRefresh}
        on:IconClick={clickRefresh}
      />
      <div class="login">
        <div
          class="today"
          on:click={gotoDailyRecommendTracks}
          bind:this={todayDom}
        >
          <div
            class="today-img-box"
            style="width: {fullWidth() -
              40}px;background-image:url({$dailyRecommendTracksStore.length !==
            0
              ? imageURL($dailyRecommendTracksStore[0].al.picUrl, { size: 800 })
              : defaultCover})"
          />
          <div class="day-box">
            <div class="day">今日推荐</div>
            <div class="name-list">
              <div class="name">
                {$dailyRecommendTracksStore.length !== 0
                  ? $dailyRecommendTracksStore[0].name
                  : ""}
              </div>
              <div class="songer">
                {$dailyRecommendTracksStore.length !== 0
                  ? songerListToStr($dailyRecommendTracksStore[0].ar)
                  : ""}
              </div>
              <div class="calendar">
                <span style="position:relative;top:2px ">
                  <Calendar2Fill size="14" />
                </span>{`${
                  new Date().getMonth() + 1
                }月${new Date().getDate()}日`}
              </div>
            </div>
          </div>
        </div>
        <div
          class="fm-box"
          on:click={playFMRadio}
          style="background:url({$FMPlayStore.album
            ? imageURL($FMPlayStore.album.blurPicUrl, { width: 80 })
            : ''})"
          bind:this={FMDom}
        >
          <div class="fm">
            <div class="fm-cover">
              <img
                class="fm-cover-img"
                src={$FMPlayStore.album
                  ? imageURL($FMPlayStore.album.blurPicUrl, { size: 240 })
                  : ""}
                alt=""
              />
            </div>
            <div class="fm-info">
              {#if $isFMPlaying && $isPlaying && $currentSongStore.id === $FMPlayStore.id}
                <div class="fm-play-motion">
                  <div class="pull_down pull_down1" />
                  <div class="pull_down pull_down2" />
                  <div class="pull_down pull_down3" />
                  <div class="pull_down pull_down4" />
                  <div class="pull_down pull_down5" />
                  <div class="pull_down pull_down6" />
                  <div class="pull_down pull_down7" />
                  <div class="pull_down pull_down8" />
                  <div class="pull_down pull_down9" />
                  <div class="pull_down pull_down10" />
                </div>
              {/if}
              <div class="fm-name">
                {$FMPlayStore.name ? $FMPlayStore.name : ""}
                <span class="alia">
                  {$FMPlayStore.alia && $FMPlayStore.alia.length > 0
                    ? `(${$FMPlayStore.alia[0]})`
                    : ""}
                </span>
              </div>
              <div class="fm-songer">
                {$FMPlayStore.artists
                  ? songerListToStr($FMPlayStore.artists)
                  : ""}
                {#if $FMPlayStore.al}
                  <span>
                    {$FMPlayStore.al.name === ""
                      ? ""
                      : `- ${$FMPlayStore.al.name}`}
                    <!-- {$FMPlayStore.al === true}
                  {$FMPlayStore.album === true} -->
                    <!-- {$FMPlayStore.al
                    ? $FMPlayStore.al.name === ""
                      ? ""
                      : `- ${$FMPlayStore.al.name}`
                    : $FMPlayStore.album.name === ""
                    ? ""
                    : `- ${$FMPlayStore.album.name}`} -->
                  </span>
                {/if}
              </div>
              <div class="fm-icon">
                <span style="position:relative;top:2px ">
                  <RadioFill size="14" />
                </span>
                私人 FM
              </div>
            </div>
          </div>
        </div>
        <div class="list-grid">
          <ListGrid
            title="每日歌单推荐"
            isShowMore={false}
            playList={dailyRecommendPlayList}
          />
        </div>
        {#if similarSongs.length > 0}
          <div class="simiTitle">相似歌曲推荐</div>
          <div class="desc">根据单曲《{randomTenLoveSong.name}》推荐</div>
          <SongList songList={similarSongs} />
        {/if}
        {#if similarPlayList.length > 0}
          <div class="list-grid">
            <ListGrid
              title="相似歌单推荐"
              isShowMore={false}
              isShowTip={true}
              tipTextList={[`根据单曲《${randomLoveSong.name}》推荐`]}
              playList={similarPlayList}
            />
          </div>
        {/if}
        {#if simiSongers.length > 0 && simiSonger.name}
          <div class="simiTitle">相似歌手推荐</div>
          <div class="desc">根据【{simiSonger.name}】推荐</div>
          <div class="songer-box">
            {#each simiSongers as songer}
              <Songer {songer} coverSize={330} />
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div>
      <TopTitle
        title="推荐"
        desc="专属推荐"
        topTitleRightList={{ type: "text", text: "" }}
      />
      <div class="noLogin">
        <div>
          <img class="login-img" src="images/login.png" alt="" />
        </div>
        <div class="tip">推荐功能需要登录</div>
        <div class="login-btn">
          <Button
            type="primary"
            on:BtnClick={() => {
              isHomePageStore.set(false);
              push("/login");
            }}
          >
            立即登录
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .songer-box {
    display: grid;
    justify-content: space-between;
    grid-template-columns: repeat(3, 100px);
    padding: 0 20px;
  }
  .alia {
    color: rgb(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: normal;
  }
  .fm-songer {
    color: rgb(255, 255, 255, 0.7);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
  }
  .simiTitle {
    margin-top: 20px;
    text-align: left;
    margin-left: 20px;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .desc {
    font-size: 12px;
    color: rgb(141, 141, 141);
    text-align: justify;
    margin: 10px 0;
    padding: 0 20px;
  }
  .list-grid {
    margin-top: 30px;
  }
  .fm-play-motion {
    position: absolute;
    width: 100%;
    height: 74px;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
  }
  .pull_down {
    flex: 1;
    height: 6px;
    margin: 0px 6px;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
  }
  .pull_down1 {
    -webkit-animation: jumpY1 1.5s infinite ease-in-out;
    -o-animation: jumpY1 1.5s infinite ease-in-out;
    animation: jumpY1 1.5s infinite ease-in-out;
  }
  .pull_down2 {
    -webkit-animation: jumpY2 1.2s infinite ease-in-out;
    -o-animation: jumpY2 1.2s infinite ease-in-out;
    animation: jumpY2 1.2s infinite ease-in-out;
  }
  .pull_down3 {
    -webkit-animation: jumpY3 1s infinite ease-in-out;
    -o-animation: jumpY3 1s infinite ease-in-out;
    animation: jumpY3 1s infinite ease-in-out;
  }
  .pull_down4 {
    -webkit-animation: jumpY4 1.1s infinite ease-in-out;
    -o-animation: jumpY4 1.1s infinite ease-in-out;
    animation: jumpY4 1.1s infinite ease-in-out;
  }
  .pull_down5 {
    -webkit-animation: jumpY5 1.6 infinite ease-in-out;
    -o-animation: jumpY5 1.6s infinite ease-in-out;
    animation: jumpY5 1.6s infinite ease-in-out;
  }
  .pull_down6 {
    -webkit-animation: jumpY6 1.5s infinite ease-in-out;
    -o-animation: jumpY6 1.5s infinite ease-in-out;
    animation: jumpY6 1.5s infinite ease-in-out;
  }
  .pull_down7 {
    -webkit-animation: jumpY7 1.7s infinite ease-in-out;
    -o-animation: jumpY7 1.7s infinite ease-in-out;
    animation: jumpY7 1.7s infinite ease-in-out;
  }
  .pull_down8 {
    -webkit-animation: jumpY8 1.9s infinite ease-in-out;
    -o-animation: jumpY8 1.9s infinite ease-in-out;
    animation: jumpY8 1.9s infinite ease-in-out;
  }
  .pull_down9 {
    -webkit-animation: jumpY9 1.1s infinite ease-in-out;
    -o-animation: jumpY9 1.1s infinite ease-in-out;
    animation: jumpY9 1.1s infinite ease-in-out;
  }
  .pull_down10 {
    -webkit-animation: jumpY10 1.5s infinite ease-in-out;
    -o-animation: jumpY10 1.5s infinite ease-in-out;
    animation: jumpY10 1.5s infinite ease-in-out;
  }
  @keyframes jumpY1 {
    0% {
      height: 74px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 74px;
    }
  }
  @keyframes jumpY2 {
    0% {
      height: 44px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 44px;
    }
  }
  @keyframes jumpY3 {
    0% {
      height: 30px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 30px;
    }
  }
  @keyframes jumpY4 {
    0% {
      height: 51px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 51px;
    }
  }
  @keyframes jumpY5 {
    0% {
      height: 51px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 51px;
    }
  }
  @keyframes jumpY6 {
    0% {
      height: 61px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 61px;
    }
  }
  @keyframes jumpY7 {
    0% {
      height: 47px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 47px;
    }
  }
  @keyframes jumpY8 {
    0% {
      height: 21px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 21px;
    }
  }
  @keyframes jumpY9 {
    0% {
      height: 61px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 61px;
    }
  }
  @keyframes jumpY10 {
    0% {
      height: 49px;
    }
    50% {
      height: 6px;
    }
    100% {
      height: 49px;
    }
  }
  .noLogin {
    width: 80%;
    margin: auto;
  }
  .login-img {
    width: 80%;
  }
  .tip {
    margin: 20px 0;
    font-size: 18px;
    text-align: center;
  }
  .login {
    text-align: center;
  }
  .login-box {
    top: 0px;
    position: relative;
  }
  .love {
    font-size: 14px;
    margin-bottom: constant(safe-area-inset-bottom);
    margin-bottom: env(safe-area-inset-bottom);
    padding-bottom: 120px;
  }
  .today {
    margin: 0 20px;
    border-radius: 10px;
    color: #fff;
    overflow: hidden;
    transform: rotate(0deg);
    position: relative;
  }
  .today-img-box {
    height: 335px;
    width: 335px;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -3;
    animation: move 40s infinite;
    background-image: url("/images/defaultCover.png");
    -webkit-animation: move 40s infinite;
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
  }
  @keyframes move {
    0% {
      transform: translateY(-47%);
    }
    50% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-47%);
    }
  }
  .day-box {
    height: 180px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.1) 20%,
      rgba(0, 0, 0, 0.2) 40%,
      rgba(0, 0, 0, 0.3) 60%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }
  .day {
    flex: 1;
    font-size: 40px;
    line-height: 90px;
    font-weight: bold;
  }
  .name {
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: bold;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .name-list {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    text-align: left;
  }
  .fm {
    display: flex;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    padding: 10px;
    border-radius: 10px;
  }
  .fm-box {
    margin: 0 20px;
    color: #fff;
    border-radius: 10px;
    margin-top: 20px;
    background: url("");
    background-size: cover !important;
    background-position: 50% 50% !important;
  }
  .fm-cover {
    flex: 1;
    height: 74px;
    width: 74px;
    overflow: hidden;
    border-radius: 5px;
  }
  .fm-cover-img {
    width: 100%;
    border-radius: 5px;
  }
  .fm-info {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-left: 10px;
    text-align: left;
    flex: 3;
  }
  .fm-name {
    font-size: 18px;
    font-weight: bold;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .fm-icon {
    text-align: right;
    font-size: 12px;
  }
  .calendar {
    text-align: right;
  }
</style>
