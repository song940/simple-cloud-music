<script>
  import { onMount } from 'svelte';

  import Love from './Love.svelte';
  import Discover from './Discover.svelte';
  import Mine from './Mine.svelte';

  import { dailySignin } from '../api/user';

  import { isLoginStore, tabbarActive } from '../store/common';

  onMount(() => {
    $isLoginStore ? tabbarActive.set(0) : tabbarActive.set(1);
    //签到
    let date = new Date();
    if (
      $isLoginStore &&
      localStorage.getItem('dailySigninFun_date') != '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
    ) {
      // dailySigninFun();
    }
  });
  //签到
  async function dailySigninFun() {
    // await dailySignin();
    let date = new Date();
    // localStorage.setItem('dailySigninFun_date', '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate());
  }
</script>

<div style="display:{$tabbarActive === 0 ? 'block' : 'none'}">
  <Love />
</div>
<div style="display:{$tabbarActive === 1 ? 'block' : 'none'}">
  <Discover />
</div>
<div style="display:{$tabbarActive === 2 ? 'block' : 'none'}">
  <Mine />
</div>
