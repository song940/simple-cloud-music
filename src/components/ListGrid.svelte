<script>
  import { createEventDispatcher } from "svelte";
  import { ArrowRightSLine } from "svelte-remixicon";

  import { Tip } from "./base";
  import Album from "./Album.svelte";

  export let title = "";
  export let playList = [];
  export let isShowMore = true;
  export let isShowTip = false;
  export let tipTextList = "";
  export let iconText = "更多";

  const dispatch = createEventDispatcher();
  function onClickTitle() {
    dispatch("titleClick");
  }
</script>

<div class="grid">
  <div class="title" on:click={onClickTitle}>
    <div class="title-left">{title}</div>
    {#if isShowMore}
      <div class="title-right">
        {iconText}
        <span class="title-icon">
          <ArrowRightSLine size="24" style="vertical-align: middle;" />
        </span>
      </div>
    {/if}
  </div>
  {#if isShowTip}
    <div class="tip">
      <Tip {tipTextList} />
    </div>
  {/if}
  <slot />
  <div class="list">
    {#each playList as album}
      <div class="item">
        <Album
          name={album.name}
          coverImgUrl={album.coverImgUrl}
          id={album.id}
          width={220}
          playCount={album.playCount}
          copywriter={album.copywriter || ""}
          trackCount={album.trackCount}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .tip {
    padding: 10px 20px;
  }
  .title-icon {
    position: relative;
    top: -2px;
  }
  .title-right {
    line-height: 24px;
    border-radius: 10px;
    font-size: 14px;
    color: #666;
    height: 24px;
    text-align: center;
    margin-right: 20px;
  }
  .title {
    text-align: left;
    margin-left: 20px;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
  }
  .list {
    text-align: left;
    white-space: nowrap;
    overflow-x: scroll;
    overflow-y: hidden;
    display: flex;
  }
  .item {
    margin-right: 20px;
    flex-shrink: 0;
    display: inline-block;
  }
  .list > :global(:first-child) {
    margin-left: 20px;
  }
  .list > :global(:last-child) {
    margin-right: 20px;
  }
  ::-webkit-scrollbar {
    display: none; /* Chrome Safari */
  }
</style>
