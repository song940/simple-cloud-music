<script>
  import { onMount } from "svelte";
  import Lazy from "svelte-lazy";
  import { push } from "svelte-stack-router";
  import { StarSFill } from "svelte-remixicon";

  import { imageURL } from "../utils/common";
  import { isHomePageStore } from "../store/common";

  export let songer = {};
  export let coverSize = 200;

  let useLoveSongerIds = [];

  function gotoArtist() {
    isHomePageStore.set(false);
    push(`/artist?id=${songer.id}`);
  }
</script>

<div class="singer" on:click={gotoArtist}>
  {#if useLoveSongerIds.includes(songer.id)}
    <div class="star">
      <StarSFill size="14" style="vertical-align: middle" />
    </div>
  {/if}
  <div class="cover">
    <Lazy height={100}>
      <img src={imageURL(songer.img1v1Url, { size: coverSize })} alt="" />
    </Lazy>
  </div>
  <div class="name">{songer.name}</div>
</div>

<style>
  .singer {
    padding: 10px 0;
    text-align: center;
    position: relative;
  }
  .star {
    position: absolute;
    left: 0;
    top: 0;
    color: var(--primary-text-color);
  }
  .cover img {
    border-radius: 100%;
    width: 100%;
    height: 100%;
  }
  .name {
    margin-top: 6px;
    font-size: 12px;
    height: 26px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
</style>
