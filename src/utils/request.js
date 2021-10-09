import { get } from 'svelte/store';
import axios from 'axios';
import Cookies from 'js-cookie';
import { isLoadingStore } from '../store/common';
import { Alert } from './common';

let baseURL = 'https://netease-cloud-music-api-eight-lime.vercel.app/'

const service = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

service.interceptors.request.use(function (config) {
  if (!config.params) config.params = {};
  //开发环境增加cookie，避免跨域301错误
  if (config.params.cookie) {
    config.params.cookie = config.params.cookie;
  } else if (baseURL[0] !== '/') {
    const c = Cookies.get('MUSIC_U')
    c && (config.params.cookie = `MUSIC_U=${c};`);
  }
  if (!config.isHideLoading) {
    if (!get(isLoadingStore)) {
      isLoadingStore.set(true);
    }
  }
  return config;
});

service.interceptors.response.use(
  response => {
    isLoadingStore.set(false);
    const res = response.data;
    console.debug('response', response.config.url, res);
    if (res.code && ![200, 800, 801, 802, 803].includes(res.code)) {
      const msg = res.message || res.msg || '未知错误';
      const message = `${msg} (${response.config.url}: ${res.code})`;
      Alert(typeof res === 'string' ? res : message);
    }
    return res;
  },
  error => {
    isLoadingStore.set(false);
    //签到不做报错处理
    if (error.response.config.url != '/daily_signin') {
      Alert(
        error.response.data.code +
        '：' +
        (error.response.data.message
          ? error.response.data.message
          : error.response.data.msg
            ? error.response.data.msg
            : '未知错误')
      );
      return error.response.data;

      // Promise.then(error => {
      //   console.log(333, error);
      // });
      // return Promise.reject(error);
    }
  }
);

export default service;
