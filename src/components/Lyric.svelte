<script>
  import { onMount, onDestroy } from "svelte";
  import { parse, cue } from "lyric.js";
  import { scrollSmoothTo } from "../utils/common";
  import { currentLyricStore } from "../store/play";

  export let maxHeight = "";

  $: lyric = $currentLyricStore.lyric;
  $: tlyric = $currentLyricStore.tlyric;

  $: lyricArr = [];
  $: currentIndex = 0;

  let boxDom;
  let update;
  const timeupdate = () => {
    const { currentTime } = window.audioDOM;
    update(currentTime);
  };

  const mergeLyric = (a, b) => {
    const arr = [];
    for (const x of b) {
      const y = a.find((y) => x.timestamp === y.timestamp);
      if (y) {
        y.content_t = x.content;
      } else {
        a.push(x);
      }
    }
    return a;
  };

  onMount(() => {
    const a = parse(lyric);
    const b = parse(tlyric);
    lyricArr = mergeLyric(a.lines, b.lines);
    update = cue(lyricArr, (line, i) => {
      currentIndex = i;
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
        {#if tlyric && lyric.content_t}
          <div class="t-text">{lyric.content_t}</div>
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
