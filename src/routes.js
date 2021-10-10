import Home from './pages/Home.svelte';
import PlayListDetail from './pages/PlayList.svelte';
import Login from './pages/Login.svelte';
import TodayListDetail from './pages/TodayListDetail.svelte';
import LoveListDetail from './pages/LoveListDetail.svelte';
import MyAllPlayList from './pages/MyAllPlayList.svelte';
import Setting from './pages/Setting.svelte';
import Search from './pages/Search.svelte';
import Artist from './pages/Artist.svelte';
import BrSelect from './pages/BrSelect.svelte';
import MusicComment from './pages/Comments.svelte';
import AllCollectSongers from './pages/AllCollectSongers.svelte';
import SongerDesc from './pages/SongerDesc.svelte';
import MoreSonger from './pages/MoreSonger.svelte';
import MoreList from './pages/MoreList.svelte';
import MoreSong from './pages/MoreSong.svelte';
import About from './pages/About.svelte';

const routes = {
  '/playlist': PlayListDetail,
  '/daily': TodayListDetail,
  '/loveListDetail': LoveListDetail,
  '/myAllPlayList': MyAllPlayList,
  '/login': Login,
  '/setting': Setting,
  '/search': Search,
  '/artist': Artist,
  '/brSelect': BrSelect,
  '/comments': MusicComment,
  '/allCollectSongers': AllCollectSongers,
  '/songerDesc': SongerDesc,
  '/moreSonger': MoreSonger,
  '/moreList': MoreList,
  '/moreSong': MoreSong,
  '/about': About,
  '*': Home,
};

export default routes;
