<script>
  import { onMount, onDestroy } from "svelte";
  import { pop, search } from "svelte-stack-router";
  import md5 from "crypto-js/md5";
  import { LinksLine } from "svelte-remixicon";
  import QrCode from "svelte-qrcode";

  import { NavBar, Input, Button } from "../components/base";

  import { isHomePageStore, isLoginStore } from "../store/common";
  import { playIsMinStore } from "../store/play";
  import {
    userInfoStore,
    userLikeSongIdsStore,
    userLikeListIdStore,
  } from "../store/user";

  import {
    loginWithPhone,
    loginWithEmail,
    loginQrCodeKey,
    loginQrCodeCreate,
    loginQrCodeCheck,
  } from "../api/auth";
  import {
    userPlaylist,
    userLikedSongsIDs,
    likedArtists,
    userAccount,
    sendSmsCode,
  } from "../api/user";

  import { setCookies, Alert, Toast, parseQuery } from "../utils/common";

  let { type = "phone" } = parseQuery($search);

  let timerLogin = null;

  let phone = "";
  let phone_code = "";
  let phone_password = "";

  let email = "";
  let email_password = "";

  $: phoneType = "code"; //code--短信验证，pwd--密码验证
  let tiptext =
    "您的密码会进行 MD5 加密后再传输到网易云 API。本应用不会传输您的账号数据到任何非网易云音乐官方服务器。";
  $: loginType =
    type === "qr" ? "二维码登录" : type === "phone" ? "手机号登录" : "邮箱登录";
  $: qrImg = "";
  $: qrTip = "请扫码";
  $: btnText = "获取验证码";

  function isPhone(phone) {
    //手机号正则
    let mPattern = /^1[3-9]\d{9}$/;
    //返回 true or false
    return mPattern.test(phone);
  }

  function loginSuccFun(res) {
    //登录成功
    setCookies(res.cookie);
    isLoginStore.set(true);
    userInfoStore.set(res);
    localStorage.setItem("isLogin", true);
    localStorage.setItem("userInfo", JSON.stringify(res));
    setTimeout(() => pop(), 100);
    // userPlaylistFun(res);
  }
  //手机号登录
  async function doPhoneLogin() {
    if (!isPhone(phone)) {
      return Toast("请输入正确的手机号");
    }
    if (phoneType === "code" && phone_code.length != 4) {
      return Toast("请输入四位验证码");
    }

    let params = {};
    if (phoneType === "code") {
      //验证码验证
      params = {
        phone,
        captcha: phone_code,
        password: "fakePassword",
      };
    } else {
      //密码验证
      params = {
        phone,
        md5_password: phone_password,
        password: "fakePassword",
      };
    }
    const res = await loginWithPhone(params);
    if (res.code === 200) {
      loginSuccFun(res);
    } else {
      Alert("登录不成功, 请重新登录。");
    }
  }
  //邮箱登录
  async function doEmailLogin() {
    const res = await loginWithEmail({
      email,
      md5_password: email_password,
      password: "fakePassword",
    });
    if (res.code === 200) {
      loginSuccFun(res);
    } else {
      Alert("登录不成功, 请重新登录。");
    }
  }
  onMount(() => {
    isHomePageStore.set(false);
    playIsMinStore.set(false);
  });
  onDestroy(() => {
    playIsMinStore.set(true);
  });
  function set_phone_password(e) {
    phone_password = md5(e.detail.value).toString();
  }
  function set_phone_code(e) {
    phone_code = e.detail.value.toString();
  }
  function set_email_password(e) {
    email_password = md5(e.detail.value).toString();
  }
  function getPhone(e) {
    phone = e.detail.value;
  }
  function set_email_assress(e) {
    email = e.detail.value;
  }

  // async function userPlaylistFun(login) {
  //   //获取用户收藏歌单ID列表,用于判断是否已经收藏
  //   const res = await userPlaylist({
  //     uid: login.account.id,
  //     limit: 10000,
  //     offset: 0,
  //   });
  //   if (res.code === 200) {
  //     let ids = [];
  //     for (let i = 0; i < res.playlist.length; i++) {
  //       ids.push(res.playlist[i].id);
  //     }

  //     if (
  //       res.playlist[0].creator.userId === $userInfoStore.account.id &&
  //       res.playlist[0].name.substr(-5) === "喜欢的音乐"
  //     ) {
  //       userLikeListIdStore.set(res.playlist[0].id);
  //       localStorage.setItem("userLikeListId", res.playlist[0].id);
  //     }

  //     localStorage.setItem("usePlayListIds", JSON.stringify(ids));
  //     userLikedSongsIDsFun(login);
  //   } else {
  //     Alert("获取收藏歌单失败");
  //   }
  // }
  // async function userLikedSongsIDsFun(login) {
  //   //获取用户喜爱歌曲ID列表,用于判断是否已经收藏
  //   const res = await userLikedSongsIDs(login.account.id);
  //   if (res.code === 200) {
  //     let ids = [];
  //     for (let i = 0; i < res.ids.length; i++) {
  //       ids.push(res.ids[i]);
  //     }
  //     isLoginStore.set(true);
  //     localStorage.setItem("isLogin", true);
  //     userLikeSongIdsStore.set(JSON.stringify(ids));
  //     localStorage.setItem("useLoveSongIds", JSON.stringify(ids));
  //     likedArtistsFun();
  //   } else {
  //     alert("获取喜爱歌曲失败");
  //   }
  // }
  // //获取收藏的歌手
  // async function likedArtistsFun() {
  //   const res = await likedArtists({ limit: 2000 });
  //   if (res.code === 200) {
  //     let ids = [];
  //     for (let i = 0; i < res.data.length; i++) {
  //       ids.push(res.data[i].id);
  //     }
  //     localStorage.setItem("useLoveSongerIds", JSON.stringify(ids));
  //     setTimeout(() => {
  //       pop();
  //     }, 100);
  //   } else {
  //     alert("获取喜爱歌手失败");
  //   }
  // }
  async function qrLoginFun() {
    type = "qr";
    const res = await loginQrCodeKey();
    if (res.code === 200) {
      loginQrCodeCreateFun(res.data.unikey);
    }
  }
  async function loginQrCodeCreateFun(key) {
    const res = await loginQrCodeCreate({
      key,
    });
    if (res.code === 200) {
      qrImg = res.data.qrurl;
      timerLogin = setInterval(() => {
        loginQrCodeCheckFun(key);
      }, 1000);
    }
  }
  async function loginQrCodeCheckFun(key) {
    const res = await loginQrCodeCheck(key);
    if (res.code === 800) {
      qrTip = res.message;
    } else if (res.code === 801) {
      qrTip = res.message;
    } else if (res.code === 802) {
      qrTip = res.message;
    } else if (res.code === 803) {
      clearInterval(timerLogin);
      setTimeout(() => {
        userAccountFun(res.cookie);
      }, 300);
    } else {
      clearInterval(timerLogin);
    }
  }
  async function userAccountFun(cookie) {
    const res = await userAccount(cookie);
    if (res.code === 200) {
      let newres = res;
      newres.cookie = cookie;
      loginSuccFun(newres);
    }
  }
  async function sendSmsCodeFun() {
    if (btnText === "获取验证码") {
      if (!isPhone(phone)) {
        Toast("请输入正确的手机号");
      } else {
        const res = await sendSmsCode(phone);
        if (res.code === 200) {
          Toast(
            "验证码已发送至" +
              phone.substring(phone.length - 4) +
              "，请注意查收！",
            2000
          );
          setinter60();
        }
      }
    }
  }
  function setinter60() {
    let time = 59;
    let myTimer = setInterval(() => {
      time--;
      if (time === 0) {
        clearInterval(myTimer);
        btnText = "获取验证码";
      } else {
        btnText = time + "s 后重发";
      }
    }, 1000);
  }
</script>

<NavBar title={loginType} />
<div class="login-page">
  <div class="desc">请使用网易云音乐账号登录</div>
  <div class="lead">
    <div class="netease">
      <img src="/images/nm_logo.png" alt="" />
    </div>
    <div class="arr">
      <LinksLine />
    </div>
    <div class="simple"><img src="/images/sm_logo.png" alt="" /></div>
  </div>
  {#if type === "qr"}
    <div class="qr">
      <div class="qr-tip">{qrTip}</div>
      <div class="qrcode">
        <QrCode value={qrImg} />
      </div>
      <div class="tip">
        直接使用网易云音乐 APP 扫码登录，或截图保存之后使用网易云音乐 APP
        扫码登录。
      </div>
    </div>
  {/if}
  {#if type === "phone"}
    <div class="phone">
      <Input label="手机号" type="tel" maxlength="11" on:setInput={getPhone} />
      {#if phoneType === "pwd"}
        <Input
          label="密码"
          type="password"
          maxlength="40"
          bind:phone_password
          on:setInput={set_phone_password}
        />
      {/if}
      {#if phoneType === "code"}
        <Input
          label="验证码"
          type="tel"
          maxlength="4"
          bind:phone_code
          rightBtn={true}
          {btnText}
          on:setInput={set_phone_code}
          on:setBtn={sendSmsCodeFun}
        />
      {/if}
      <div class="phone-switch">
        {#if phoneType === "pwd"}
          <span
            on:click={() => {
              phoneType = "code";
            }}
          >
            短信验证
          </span>{/if}
        {#if phoneType === "code"}
          <span
            on:click={() => {
              phoneType = "pwd";
            }}
          >
            密码验证
          </span>
        {/if}
      </div>
      <div class="btn">
        <Button on:BtnClick={doPhoneLogin} type="primary">登录</Button>
      </div>
      {#if phoneType === "pwd"}
        <div class="tip">{tiptext}</div>
      {/if}
    </div>
  {/if}

  {#if type === "email"}
    <div class="email">
      <Input
        label="邮箱"
        maxlength={30}
        type="text"
        on:setInput={set_email_assress}
      />
      <Input
        label="密码"
        type="password"
        maxlength="40"
        bind:email_password
        on:setInput={set_email_password}
      />
      <div class="btn">
        <Button on:BtnClick={doEmailLogin} type="primary">登录</Button>
      </div>
      <div class="tip">{tiptext}</div>
    </div>
  {/if}

  <div class="type-switch">
    {#if type !== "phone"}
      <span
        on:click={() => {
          clearInterval(timerLogin);
          type = "phone";
        }}
      >
        手机号登录
      </span>
    {/if}

    {#if type !== "qr"}
      <span on:click={qrLoginFun}> 二维码登录 </span>
    {/if}

    {#if type !== "email"}
      <span
        on:click={() => {
          type = "email";
          clearInterval(timerLogin);
        }}
      >
        邮箱登录
      </span>
    {/if}
  </div>
</div>

<style>
  .desc {
    font-size: 12px;
    text-align: center;
    color: #666;
    margin: 20px;
  }
  .qr-tip {
    text-align: center;
    margin: 20px auto;
  }
  .login-page {
    padding-top: 50px;
    font-size: 16px;
  }
  .btn {
    margin: 10px auto;
    width: 80%;
  }
  .qr {
    text-align: center;
  }
  .qrcode {
    margin: auto;
    width: 200px;
    height: 200px;
    background: cornflowerblue;
  }
  .tip {
    width: 80%;
    text-align: justify;
    font-size: 12px;
    line-height: 16px;
    margin: 20px auto;
    word-break: break-all;
  }
  .lead {
    text-align: center;
    align-items: center;
    margin: 20px auto;
    width: 50%;
    display: flex;
    justify-content: center;
  }
  .netease {
    flex: 1.5;
  }
  img {
    width: 100%;
  }
  .arr {
    color: rgb(139, 139, 139);
    flex: 1;
  }
  .simple {
    flex: 1.5;
  }
  .phone-switch {
    margin: 20px;
    text-align: center;
    color: var(--primary-text-color);
  }
  .type-switch {
    position: fixed;
    width: 100%;
    bottom: 40px;
    text-align: center;
    color: var(--primary-text-color);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .type-switch span + .type-switch span::before {
    content: " | ";
    display: inline-block;
    width: 1em;
    height: 1em;
  }
</style>
