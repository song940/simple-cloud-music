<script>
  import { onMount, onDestroy } from "svelte";
  import { parse } from "lyric.js";
  import { currentLyricStore } from "../store/play";
  import { isShowTranslateStore } from "../store/common";

  import { scrollSmoothTo } from "../utils/common";

  export let maxHeight = "";

  $: lyric = $currentLyricStore.lyric;
  $: tlyric = $isShowTranslateStore ? $currentLyricStore.tlyric : "";
  $: lyricArr = [];
  $: currentIndex = 0;
  let boxDom;

  const cue = (arr, fn) => {
    let current;
    return (time) => {
      // console.debug("currentTime:", time);
      arr.forEach((x, i) => {
        const next = arr[i + 1];
        if (
          time >= x.timestamp &&
          (next ? time < next.timestamp : true) &&
          current !== x
        ) {
          currentIndex = i;
          current = x;
          fn(x);
        }
      });
    };
  };

  let update;

  const timeupdate = () => {
    const { currentTime } = window.audioDOM;
    const currentTimeMS = currentTime * 1000;
    update(currentTimeMS);
  };

  onMount(() => {
    lyricArr = parse(lyric);
    console.table(lyricArr);
    update = cue(lyricArr, (line) => {
      const active = boxDom.querySelector(".active");
      const offset = Math.max(0, active.offsetTop - 200);
      console.debug(line, active.offsetTop, offset);
      scrollSmoothTo(boxDom, offset);
    });
    window.audioDOM.addEventListener("timeupdate", timeupdate);
  });

  onDestroy(() =>
    window.audioDOM.removeEventListener("timeupdate", timeupdate)
  );
</script>

<div class="lyric" bind:this={boxDom}>
  <div class="box" style="max-height:{maxHeight}">
    {#each lyricArr as lyric, i}
      <div class="ly" class:active={i === currentIndex}>
        <div>{lyric.content}</div>
        {#if tlyric.trim() !== ""}
          <div class="t-text">{lyric.text_t}</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .lyric {
    overflow-y: scroll;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: auto;
  }
  .ly {
    word-wrap: break-word;
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    padding: 10px;
    transition: all 0.5s ease-in;
    -webkit-transition: all 0.5s ease-in;
    opacity: 0.5;
    filter: blur(1px);
    -webkit-filter: blur(1px);
    text-align: center;
  }
  .active {
    opacity: 1;
    filter: none;
    -webkit-filter: none;
  }
  .t-text {
    font-size: 16px;
  }
</style>
