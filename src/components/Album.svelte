<script>
  import { onMount } from "svelte";
  import Lazy from "svelte-lazy";
  import { push } from "svelte-stack-router";
  import { PlayMiniLine } from "svelte-remixicon";

  import { playListIdStore } from "../store/playList";
  import { isHomePageStore } from "../store/common";

  import { ripple, tranNumber, Confirm } from "../utils/common";

  export let coverImgUrl = "";
  export let playCount = 0;
  export let name = "";
  export let copywriter = "";
  export let id = 0;
  export let width = 150;
  export let trackCount = 0;

  const noop = () => void 0;

  noop("trackCount", trackCount);

  let coverDom;
  onMount(() => {
    if (coverDom) {
      ripple(coverDom);
    }
  });
  function goToDetail() {
    isHomePageStore.set(false);
    push(`/playlist?id=${id}`);
  }
</script>

<div
  class="cover"
  on:click={goToDetail}
  style="width:{width}px"
  bind:this={coverDom}
>
  <div class="cover-img" style="width:{width}px;height:{width}px">
    <Lazy height={width}>
      <img
        src={coverImgUrl.replace(/^http:/, "https:") +
          `?param=${width * 2}y${width * 2}`}
        alt=""
      />
    </Lazy>
  </div>
  <div class="play-num">
    <span style="position: relative;top:1px">
      <PlayMiniLine />
    </span>
    {tranNumber(playCount)}
  </div>
  <div class="name" style="width:{width}px;">{name}</div>
  {#if copywriter && copywriter !== null && copywriter !== ""}
    <div class="copywriter">{copywriter}</div>
  {/if}
</div>

<style>
  .play-num {
    margin: 4px auto;
    font-size: 10px;
    color: rgb(146, 146, 146);
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .copywriter {
    margin: 4px auto;
    font-size: 12px;
    color: rgb(146, 146, 146);
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    height: 26px;
  }
  .cover {
    width: 105px;
    padding-bottom: 10px;
  }
  .cover-img {
    overflow: hidden;
    width: 150px;
    height: 150px;
  }
  img {
    width: 100%;
    border-radius: 6px;
  }
  .name {
    margin-top: 4px;
    line-height: 16px;
    width: 150px;
    height: 32px;
    font-size: 12px;
    text-align: left;
    font-weight: bold;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
</style>
